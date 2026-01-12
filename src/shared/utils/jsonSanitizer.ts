/**
 * jsonSanitizer.ts
 *
 * Attempts to fix common JSON issues from LLM output,
 * particularly unescaped quotes in HTML attribute values.
 */

/**
 * Sanitize JSON string to fix common LLM output issues
 *
 * Problem: LLM outputs HTML like <span style="color:red"> inside JSON strings,
 * but those inner double quotes break JSON parsing.
 *
 * Solution: Convert double quotes in HTML attributes to single quotes.
 */
export function sanitizeJsonString(jsonStr: string): string {
    // Pattern: Find style="..." or class="..." patterns inside JSON string values
    // and convert the inner double quotes to single quotes

    // This regex finds HTML attributes with double quotes that are INSIDE a JSON string
    // It looks for patterns like: style="..." or href="..." etc.
    const htmlAttrPattern = /(\w+)="([^"]*?)"/g;

    // We need to be careful - only fix attributes inside JSON string values
    // Strategy: Find JSON string values and fix HTML attributes within them

    let result = jsonStr;

    // Find strings that look like they contain HTML (have < and >)
    // and fix double-quoted attributes inside them
    result = result.replace(
        /"([^"]*<[^"]*>.*?)"/g,
        (match, content) => {
            // Inside this JSON string value, fix HTML attribute quotes
            const fixed = content.replace(
                /(\s)(\w+)="([^"]*)"/g,
                (_, space: string, attr: string, value: string) => `${space}${attr}='${value}'`
            );
            return `"${fixed}"`;
        }
    );

    return result;
}

/**
 * Try to parse JSON with automatic sanitization on failure
 */
export function parseJsonWithSanitization(jsonStr: string): {
    data: any;
    wasSanitized: boolean;
    error?: string;
} {
    // First, try parsing as-is
    try {
        return {
            data: JSON.parse(jsonStr),
            wasSanitized: false
        };
    } catch (firstError) {
        // Try sanitizing and parsing again
        try {
            const sanitized = sanitizeJsonString(jsonStr);
            const data = JSON.parse(sanitized);
            console.warn('[JSON Sanitizer] Fixed malformed JSON (likely unescaped quotes in HTML)');
            return {
                data,
                wasSanitized: true
            };
        } catch (secondError) {
            // Still failed - return original error
            return {
                data: null,
                wasSanitized: false,
                error: `JSON Parse Error: ${(firstError as Error).message}. ` +
                       `Common cause: unescaped double quotes in HTML attributes. ` +
                       `Use single quotes in HTML: style='color:red' instead of style="color:red"`
            };
        }
    }
}
