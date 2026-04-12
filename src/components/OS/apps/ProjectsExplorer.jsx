// src/components/OS/apps/ProjectsExplorer.jsx
import { useState } from 'react'

const TREE = [
  {
    id: 'reseau',
    label: 'Réseau & Infrastructure',
    icon: '🗂️',
    files: [
      {
        id: 'ad',
        name: 'Active_Directory',
        ext: 'proj',
        icon: '🖧',
        size: '1 024 Ko',
        date: '03/2026',
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
        id: 'pfsense',
        name: 'pfSense_Firewall',
        ext: 'proj',
        icon: '🔥',
        size: '768 Ko',
        date: '02/2026',
        tech: 'pfSense · VyOS · NAT · Firewall · VirtualBox',
        desc: `Étude comparative VyOS vs pfSense pour l'interconnexion réseau.

Objectifs :
  • Configuration d'un pare-feu pfSense (FreeBSD)
  • Mise en place NAT et règles de filtrage
  • Routage statique inter-sous-réseaux
  • Tests de connectivité avec ping / traceroute
  • Comparaison fonctionnelle avec VyOS

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
        id: 'audit',
        name: 'Audit_Secu',
        ext: 'proj',
        icon: '🔐',
        size: '512 Ko',
        date: '04/2026',
        tech: 'Kali Linux · Wireshark · Hashcat · Hydra',
        desc: `Initiation aux outils d'audit de sécurité réseau.

Outils utilisés :
  • Wireshark — capture et analyse de trames réseau
  • Hashcat — craquage de mots de passe (MD5, SHA-1)
  • Hydra — test de robustesse par force brute
  • Kali Linux comme environnement de travail

Contexte : TP encadrés en environnement isolé (VMs),
dans le cadre du module cybersécurité BTS SIO SISR.`,
      },
    ],
  },
  {
    id: 'supervision',
    label: 'Supervision',
    icon: '🗂️',
    files: [
      {
        id: 'zabbix',
        name: 'Zabbix_Grafana',
        ext: 'proj',
        icon: '📊',
        size: '2 048 Ko',
        date: '01/2026',
        tech: 'Zabbix 7.4 · Grafana · Ubuntu Server · MySQL · ICMP/SNMP',
        desc: `Supervision de la connectivité internet d'une organisation.

Infrastructure mise en place :
  • Ubuntu Server 22.04 comme hôte de supervision
  • Zabbix 7.4 avec base de données MySQL
  • Monitoring ICMP via fping (connectivité internet)
  • Intégration Grafana pour les dashboards temps réel
  • Suivi de l'espace disque et des interfaces réseau

Résultat : tableau de bord Grafana opérationnel avec
alertes ICMP et surveillance de l'espace disque.`,
      },
    ],
  },
]

export function ProjectsExplorer() {
  const [selectedFolder, setSelectedFolder] = useState(TREE[0])
  const [selectedFile,   setSelectedFile]   = useState(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: 'var(--w-font)', fontSize: 11 }}>

      {/* Barre d'adresse */}
      <div style={{
        padding: '2px 4px', borderBottom: '1px solid var(--w-dark)',
        display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
        background: 'var(--w-surface)',
      }}>
        <span style={{ color: 'var(--w-darker)' }}>Adresse :</span>
        <div style={{
          flex: 1, background: '#fff', padding: '1px 4px',
          boxShadow: 'var(--border-sunken)',
          fontFamily: 'var(--w-font)', fontSize: 11,
        }}>
          C:\Projets\{selectedFolder?.label ?? ''}
        </div>
      </div>

      {/* Corps : arbre gauche + liste droite */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Panneau gauche — dossiers */}
        <div style={{
          width: 160, flexShrink: 0,
          borderRight: '1px solid var(--w-dark)',
          overflowY: 'auto',
          padding: '2px 0',
          background: '#fff',
        }}>
          {TREE.map((folder) => (
            <div
              key={folder.id}
              className={`win95-file-row${selectedFolder?.id === folder.id ? ' selected' : ''}`}
              onClick={() => { setSelectedFolder(folder); setSelectedFile(null) }}
            >
              <span className="win95-file-icon">{folder.icon}</span>
              <span className="win95-file-name" style={{ fontSize: 10 }}>{folder.label}</span>
            </div>
          ))}
        </div>

        {/* Panneau droit — fichiers + preview */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Liste des fichiers */}
          <div style={{ flex: selectedFile ? '0 0 40%' : '1', overflowY: 'auto', background: '#fff' }}>
            {selectedFolder?.files.map((file) => (
              <div
                key={file.id}
                className={`win95-file-row${selectedFile?.id === file.id ? ' selected' : ''}`}
                onClick={() => setSelectedFile(file)}
                onDoubleClick={() => setSelectedFile(file)}
              >
                <span className="win95-file-icon">{file.icon}</span>
                <span className="win95-file-name">{file.name}.{file.ext}</span>
                <span className="win95-file-size">{file.size}</span>
                <span style={{ fontSize: 10, color: 'inherit', minWidth: 50, textAlign: 'right' }}>{file.date}</span>
              </div>
            ))}
          </div>

          {/* Preview */}
          {selectedFile && (
            <div style={{
              flex: 1, borderTop: '1px solid var(--w-dark)',
              padding: '6px 8px', overflowY: 'auto',
              background: '#fff',
            }}>
              <div style={{ fontWeight: 'bold', fontSize: 11, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 18 }}>{selectedFile.icon}</span>
                <span>{selectedFile.name}.{selectedFile.ext}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--w-darker)', marginBottom: 6, fontStyle: 'italic' }}>
                {selectedFile.tech}
              </div>
              <pre style={{
                fontFamily: '"Courier New", monospace', fontSize: 10,
                lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0, color: '#000',
              }}>
                {selectedFile.desc}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Barre de statut */}
      <div className="win95-statusbar">
        <span className="win95-statusbar-field">
          {selectedFolder?.files.length ?? 0} objet(s)
        </span>
        <span className="win95-statusbar-field">
          {selectedFile ? `${selectedFile.name}.${selectedFile.ext} sélectionné` : 'Aucune sélection'}
        </span>
      </div>
    </div>
  )
}
