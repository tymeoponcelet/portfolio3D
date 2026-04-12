// src/components/OS/apps/BioNotepad.jsx

const BIO_TEXT = `BIOGRAPHIE.TXT — Poncelet Tyméo
════════════════════════════════════════════

  Étudiant BTS SIO option SISR
  Pôle Sup DE LA SALLE — Promotion 2025-2026

────────────────────────────────────────────
  FORMATION
────────────────────────────────────────────

  BTS SIO (Services Informatiques aux Organisations)
  Spécialisation SISR — Systèmes, Réseaux & Cybersécurité
  Pôle Sup DE LA SALLE, 2025 – 2026

────────────────────────────────────────────
  OBJECTIF
────────────────────────────────────────────

  Étudiant passionné par les infrastructures réseau
  et la cybersécurité. Je recherche activement un
  stage dans les domaines suivants :
    • Administration systèmes & réseaux
    • Cybersécurité offensive / défensive
    • Supervision et monitoring

────────────────────────────────────────────
  COMPÉTENCES TECHNIQUES
────────────────────────────────────────────

  INFRASTRUCTURE & RÉSEAUX
    ✓ Windows Server / Active Directory
    ✓ Cisco Packet Tracer (routage, VLANs)
    ✓ Adressage IP / VLSM
    ✓ pfSense / VyOS (firewall, NAT, routage)
    ✓ VirtualBox

  CYBERSÉCURITÉ
    ✓ Kali Linux
    ✓ Wireshark (analyse réseau)
    ✓ Hashcat / Hydra (audit de mots de passe)
    ✓ Chiffrement / Hachage

  SYSTÈMES LINUX
    ✓ Debian / Ubuntu Server
    ✓ Gestion utilisateurs & droits
    ✓ GLPI (gestion de parc)
    ✓ Zabbix + Grafana (supervision)

────────────────────────────────────────────
  CONTACT
────────────────────────────────────────────

  Email   : tymeo.poncelet@gmail.com
  Tél     : 06 10 25 32 34
  LinkedIn: linkedin.com/in/tyméo-poncelet-83b667383

════════════════════════════════════════════
  C:\\PORTFOLIO\\BIO> _`

export function BioNotepad() {
  return (
    <textarea
      className="win95-notepad"
      defaultValue={BIO_TEXT}
      spellCheck={false}
      readOnly
    />
  )
}
