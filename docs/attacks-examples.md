# Standardized Attack Examples

## Scenario 1: SMB Relay (SOCKS)
**Summary**: Relaying captured NTLM auth to create a SOCKS tunnel for dumping credentials.
**Technical Flow**:
1.  **[Attacker (Kali)]** `nmap -p445 --script=smb2-security-mode` -> **[Target (Windows)]** (Check Signing)
2.  **[Attacker (Kali)]** `ntlmrelayx.py -tf targets.txt -socks` -> **[Target (Windows)]** (Start Listener)
3.  **[User (Victim)]** Authenticates (SMB) -> **[Attacker (Kali)]** (Poison/Relay)
4.  **[Attacker (Kali)]** Relays Auth -> **[Target (Windows)]** (Bypass Auth)
5.  **[Attacker (Kali)]** `proxychains secretsdump.py` -> **[Target (Windows)]** (Dump Hashes via SOCKS)

---

## Scenario 2: AS-REP Roasting
**Summary**: Requesting Kerberos TGT for users without Pre-Auth to crack hashes offline.
**Technical Flow**:
1.  **[Attacker (Kali)]** `impacket-GetNPUsers -request` -> **[DC (Windows Server)]** (Request TGT)
2.  **[DC (Windows Server)]** Returns TGT Hash -> **[Attacker (Kali)]** (Capture Hash)
3.  **[Attacker (Kali)]** `hashcat -m 18200` -> **[Credential (TGT Hash)]** (Offline Crack)

---

## Scenario 3: Shai Hulud 2 (Supply Chain)
**Summary**: Full supply chain compromise via npm to cloud persistence.
**Technical Flow**:
1.  **[Attacker]** Phishing/MFA Bypass -> **[User (NPM Maintainer)]**
2.  **[Attacker]** Publish Poisoned Package (Setup Bun.js) -> **[Registry (NPM)]**
3.  **[Victim (Dev Machine)]** `npm install` -> **[Registry (NPM)]** (Download Malware)
4.  **[Malware (Process)]** Forks Detached Process -> **[Victim (Dev Machine)]** (Avoid Detection)
5.  **[Malware (Process)]** Scans `~/.aws`, `~/.ssh` -> **[File System (Data)]** (Harvest Creds)
6.  **[Malware (Process)]** Git Push "Shai-Hulud" -> **[GitHub (Cloud)]** (Exfiltrate to Public Repo)
7.  **[Attacker]** Register Self-Hosted Runner -> **[GitHub (Cloud)]** (Persistence)
8.  **[Malware (Process)]** Uses Stolen Token -> **[Registry (NPM)]** (Worm Propagation)
9.  **[Attacker]** Access Infrastructure -> **[Cloud (AWS/Azure)]** (Lateral Movement)
10. **[Malware (Process)]** `shred` Home Dir -> **[Victim (Dev Machine)]** (Destructive Cleanup)