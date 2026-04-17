// src/components/OS/apps/ProjectsExplorer.jsx
import { useState } from 'react'

const TREE = [
  {
    id: 'reseau',
    label: 'Réseau & Infrastructure',
    icon: '🗂️',
    files: [
      {
        id: 'ad', name: 'Active_Directory', ext: 'proj', icon: '🖧',
        size: '1 024 Ko', date: '03/2026',
        tech: 'Windows Server · Active Directory · DNS · GPO · PowerShell',
        desc: `Déploiement d'un domaine Windows Server complet.

Objectifs :
  • Installation et configuration de Windows Server 2022
  • Mise en place de l'Active Directory (AD DS)
  • Création d'utilisateurs, groupes et unités d'organisation
  • Configuration DNS, DHCP et GPO
  • Scripts PowerShell pour automatiser la création de comptes
  • Profils itinérants et montage de lecteurs réseau

Résultat : domaine fonctionnel avec 30+ comptes, montage
automatique des lecteurs et politiques de groupe appliquées.`,
      },
      {
        id: 'pfsense', name: 'pfSense_Firewall', ext: 'proj', icon: '🔥',
        size: '768 Ko', date: '02/2026',
        tech: 'pfSense · VyOS · NAT · Firewall · VirtualBox',
        desc: `Étude comparative VyOS vs pfSense.

Objectifs :
  • Configuration d'un pare-feu pfSense (FreeBSD)
  • Mise en place NAT et règles de filtrage
  • Routage statique inter-sous-réseaux
  • Tests de connectivité avec ping / traceroute

Résultat : deux sous-réseaux virtuels interconnectés avec
règles de filtrage et NAT opérationnels.`,
      },
    ],
  },
  {
    id: 'secu',
    label: 'Cybersécurité',
    icon: '🗂️',
    files: [
      {
        id: 'audit', name: 'Audit_Secu', ext: 'proj', icon: '🔐',
        size: '512 Ko', date: '04/2026',
        tech: 'Kali Linux · Wireshark · Hashcat · Hydra',
        desc: `Initiation aux outils d'audit de sécurité réseau.

Outils utilisés :
  • Wireshark — capture et analyse de trames réseau
  • Hashcat — craquage de mots de passe (MD5, SHA-1)
  • Hydra — test de robustesse par force brute
  • Kali Linux comme environnement de travail

Contexte : TP encadrés en environnement isolé (VMs).`,
      },
    ],
  },
  {
    id: 'supervision',
    label: 'Supervision',
    icon: '🗂️',
    files: [
      {
        id: 'zabbix', name: 'Zabbix_Grafana', ext: 'proj', icon: '📊',
        size: '2 048 Ko', date: '01/2026',
        tech: 'Zabbix 7.4 · Grafana · Ubuntu Server · MySQL · ICMP/SNMP',
        desc: `Supervision de la connectivité internet d'une organisation.

Infrastructure :
  • Ubuntu Server 22.04 comme hôte de supervision
  • Zabbix 7.4 avec base de données MySQL
  • Monitoring ICMP via fping
  • Intégration Grafana pour les dashboards temps réel

Résultat : tableau de bord Grafana avec alertes ICMP.`,
      },
    ],
  },
]

export function ProjectsExplorer() {
  const [folder, setFolder]     = useState(TREE[0])
  const [file,   setFile]       = useState(null)

  return (
    <div className="win95-explorer">

      {/* Barre d'adresse */}
      <div className="win95-explorer-addr">
        <span>Adresse :</span>
        <div className="win95-explorer-addr-field">
          C:\Projets\{folder?.label ?? ''}
        </div>
      </div>

      {/* Corps */}
      <div className="win95-explorer-body">

        {/* Sidebar — dossiers */}
        <div className="win95-explorer-sidebar">
          {TREE.map((f) => (
            <div
              key={f.id}
              className={`win95-explorer-sidebar-item${folder?.id === f.id ? ' active' : ''}`}
              onClick={() => { setFolder(f); setFile(null) }}
            >
              <span style={{ fontSize: 13 }}>{f.icon}</span>
              <span style={{ fontSize: 10 }}>{f.label}</span>
            </div>
          ))}
        </div>

        {/* Panneau droit */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Liste fichiers */}
          <div style={{ flex: file ? '0 0 40%' : '1', overflowY: 'auto', background: '#fff' }}>
            {folder?.files.map((f) => (
              <div
                key={f.id}
                className={`win95-file-row${file?.id === f.id ? ' selected' : ''}`}
                onClick={() => setFile(f)}
              >
                <span className="win95-file-icon">{f.icon}</span>
                <span className="win95-file-name">{f.name}.{f.ext}</span>
                <span className="win95-file-size">{f.size}</span>
                <span style={{ fontSize: 10, minWidth: 50, textAlign: 'right' }}>{f.date}</span>
              </div>
            ))}
          </div>

          {/* Preview */}
          {file && (
            <div style={{
              flex: 1, borderTop: '1px solid var(--w-dark)',
              padding: '6px 8px', overflowY: 'auto', background: '#fff',
            }}>
              <div style={{ fontWeight: 'bold', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>{file.icon}</span>
                <span>{file.name}.{file.ext}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--w-darker)', marginBottom: 6, fontStyle: 'italic' }}>
                {file.tech}
              </div>
              <pre style={{
                fontFamily: '"Courier New", monospace', fontSize: 10,
                lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0, color: '#000',
              }}>
                {file.desc}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Statusbar */}
      <div className="win95-statusbar">
        <span className="win95-statusbar-field">{folder?.files.length ?? 0} objet(s)</span>
        <span className="win95-statusbar-field">
          {file ? `${file.name}.${file.ext}` : 'Aucune sélection'}
        </span>
      </div>
    </div>
  )
}
