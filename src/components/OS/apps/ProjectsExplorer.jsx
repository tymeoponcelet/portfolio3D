import { useState } from 'react'

const PROJECTS = [
  {
    id:      'ad',
    icon:    '🖧',
    title:   'Active Directory',
    sub:     'DÉPLOIEMENT',
    tech:    ['Windows Server 2016', 'Active Directory (AD DS)', 'DNS', 'GPO', 'PowerShell', 'Profils itinérants', 'Scripts batch'],
    desc:    "Dans le cadre du BTS SIO SISR, déploiement complet d'une infrastructure Active Directory sur Windows Server 2016 Datacenter. L'objectif est d'établir un annuaire centralisé pour gérer les utilisateurs, ordinateurs et politiques de sécurité d'un domaine.",
    steps: [
      { num: 1, title: 'Installation du rôle AD DS', body: "Ajout du rôle Services de domaine Active Directory via le Gestionnaire de serveur, puis promotion du serveur en contrôleur de domaine." },
      { num: 2, title: 'Configuration DNS', body: "Installation et configuration du serveur DNS intégré à l'AD. Paramétrage de l'interface réseau du serveur pour pointer sur lui-même (127.0.0.1) comme DNS préféré." },
      { num: 3, title: "Création des OUs, groupes et utilisateurs", body: "Création de deux Unités d'Organisation (Admin et Peda), des groupes Profs et Etudiants, et ajout d'utilisateurs via l'interface graphique puis via la commande dsadd en CLI." },
      { num: 4, title: 'Profils itinérants & dossiers de base', body: "Création des dossiers partagés \\\\SERVEUR\\Profils et \\\\SERVEUR\\Dossiersdebase. Affectation des chemins dans les propriétés de profil de chaque utilisateur avec la variable %USERNAME%." },
      { num: 5, title: 'Scripts de connexion batch', body: "Rédaction d'un script script1.bat déposé dans SYSVOL\\scripts qui monte automatiquement les lecteurs réseau X: (lecture) et Y: (écriture) à l'ouverture de session." },
      { num: 6, title: 'Import en masse via DSADD & CSVDE', body: "Automatisation de la création des comptes étudiants de la classe SIO via un script .bat lisant un fichier CSV, et test de l'import via csvde.exe." },
      { num: 7, title: 'Intégration du client Windows 10', body: "Jonction du poste Windows 10 au domaine via Paramètres > Accès professionnel. Vérification de la présence du compte ordinateur dans l'annuaire et test de connexion avec un utilisateur du domaine." },
    ],
    result: 'Domaine fonctionnel avec 3 lecteurs réseau montés automatiquement à la connexion. Annuaire peuplé de l\'ensemble des étudiants SIO via script. Profils itinérants opérationnels.',
  },
  {
    id:      'pfsense',
    icon:    '🔥',
    title:   'pfSense Firewall',
    sub:     'CONFIGURATION',
    tech:    ['pfSense (FreeBSD)', 'VyOS', 'NAT / Outbound NAT', 'Règles de filtrage WAN/LAN', 'Routage statique', 'OpenVPN', 'VirtualBox'],
    desc:    "Étude comparative entre VyOS et pfSense dans le cadre d'un TP réseau BTS SIO. Objectif : interconnecter deux sous-réseaux virtuels distincts via un WAN commun du labo SISR. pfSense a été retenu pour sa prise en main rapide.",
    steps: [
      { num: 1, title: 'Étude comparative VyOS / pfSense', body: "Analyse des deux solutions open source : VyOS (CLI-only, Debian, 512 Mo RAM) vs pfSense (WebGUI + CLI, FreeBSD, 1–2 Go RAM). pfSense sélectionné pour son interface web intuitive et sa communauté francophone." },
      { num: 2, title: 'Création des VMs', body: "Deux machines virtuelles VirtualBox par sous-réseau : une pour le routeur pfSense (2 interfaces : WAN en accès pont, LAN en réseau interne) et une pour le terminal client." },
      { num: 3, title: 'Installation guidée pfSense', body: "Démarrage sur l'ISO pfSense, installation via le terminal, redémarrage et adressage des interfaces WAN/LAN via le menu (options 1 et 2). Accès à l'interface web sur l'IP LAN." },
      { num: 4, title: 'Configuration NAT & interfaces', body: "Vérification du statut des interfaces via Status > Interfaces. Contrôle du NAT Outbound dans Firewall > NAT > Outbound pour la sortie du LAN vers le WAN." },
      { num: 5, title: 'Règles de filtrage Firewall', body: "Création des règles autorisant les protocoles TCP/UDP/ICMP depuis le WAN vers le LAN et inversement. Configuration dans Firewall > Rules > WAN et LAN." },
      { num: 6, title: 'Routes statiques inter-réseaux', body: "Ajout d'une route statique dans System > Routing > Static Routes pointant vers le sous-réseau distant via la gateway WAN du routeur distant." },
      { num: 7, title: 'Tests de connectivité', body: "Vérification par ping et traceroute depuis le terminal client vers l'IP du sous-réseau distant. Validation du chemin de routage complet entre les deux sous-réseaux." },
    ],
    result: 'Deux sous-réseaux virtuels interconnectés via le WAN labo. Ping et traceroute fonctionnels entre les deux terminaux. NAT et règles de filtrage opérationnels.',
  },
  {
    id:      'zabbix',
    icon:    '📊',
    title:   'Zabbix Supervision',
    sub:     'MONITORING',
    tech:    ['Zabbix 7.4', 'Grafana', 'Ubuntu Server 22.04', 'MySQL', 'fping', 'Agent Zabbix', 'ICMP / SNMP', 'Apache2'],
    desc:    "Mission de supervision de la connexion internet d'un organisme (M2L). Déploiement de Zabbix sur un serveur Ubuntu pour surveiller la disponibilité des équipements par ping ICMP et l'espace disque via agent, avec visualisation dans Grafana.",
    steps: [
      { num: 1, title: 'Installation Zabbix 7.4 sur Ubuntu', body: "Téléchargement du paquet zabbix-release depuis le dépôt officiel, installation du serveur, frontend PHP, conf Apache et agent : apt install zabbix-server-mysql zabbix-frontend-php zabbix-apache-conf zabbix-agent." },
      { num: 2, title: 'Configuration de la base de données MySQL', body: "Création de la base zabbix avec le jeu de caractères utf8mb4, création de l'utilisateur MySQL dédié, import du schéma SQL initial, puis renseignement du mot de passe dans zabbix_server.conf." },
      { num: 3, title: 'Installation & configuration de fping', body: "Installation de fping pour les tests ICMP depuis l'interface Zabbix (apt install fping), configuration des droits (chmod 4750) et vérification du chemin dans FpingLocation du fichier de conf." },
      { num: 4, title: 'Création des hôtes & templates', body: "Ajout des hôtes dans l'interface web Zabbix avec le template ICMP Ping. Installation de l'agent Zabbix Windows sur les postes clients. Ajout du template Windows by Zabbix Agent pour la surveillance disque." },
      { num: 5, title: 'Graphiques ICMP & surveillance disque', body: "Création de graphiques personnalisés (ICMP loss, ICMP ping, ICMP response time) par hôte. Vérification de l'espace disque via le tableau de bord Zabbix (Surveillance > Tableau de bord)." },
      { num: 6, title: 'Installation & configuration Grafana', body: "Installation du dépôt Grafana et du serveur (apt install grafana), démarrage du service sur le port 3000. Installation du plugin Zabbix pour Grafana (v6.1.2) et configuration de la source de données avec l'API JSON-RPC de Zabbix." },
      { num: 7, title: 'Dashboards Grafana', body: "Création de tableaux de bord personnalisés dans Grafana : graphique Space total et Space used pour le suivi de l'occupation disque en temps réel sur les hôtes supervisés." },
    ],
    result: 'Supervision ICMP opérationnelle avec alertes automatiques. Espace disque surveillé en temps réel. Dashboards Grafana connectés à Zabbix via l\'API. Hôtes Windows et Linux supervisés.',
  },
]

export function ProjectsExplorer() {
  const [active, setActive] = useState(null)

  if (active) {
    return (
      <div className="site-page-content">
        <button
          className="showcase-nav-link"
          style={{ marginBottom: 24, fontSize: 13 }}
          onClick={() => setActive(null)}
        >
          ← PROJETS
        </button>
        <h1>{active.title}</h1>
        <h3>{active.sub}</h3>
        <div className="text-block">
          <p><b>Technologies utilisées</b></p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            {Array.isArray(active.tech)
              ? active.tech.map((t) => (
                  <span key={t} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.18)', borderRadius: 4, padding: '2px 8px', fontSize: 12 }}>{t}</span>
                ))
              : <p>{active.tech}</p>
            }
          </div>
        </div>
        <div className="text-block">
          {active.desc && <><p><b>Contexte</b></p><p style={{ marginTop: 6 }}>{active.desc}</p></>}
        </div>
        {active.steps && (
          <div className="text-block">
            <p><b>Étapes réalisées</b></p>
            {active.steps.map((s) => (
              <div key={s.num} style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                <div style={{ minWidth: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{s.num}</div>
                <div>
                  <p style={{ fontWeight: 700, marginBottom: 2 }}>{s.title}</p>
                  <p style={{ opacity: 0.8, fontSize: 13 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {active.bullets && (
          <div className="text-block">
            <ul>
              {active.bullets.map((b) => <li key={b}><p>{b}</p></li>)}
            </ul>
          </div>
        )}
        <div className="text-block">
          <p><b>Résultats</b></p>
          <p style={{ marginTop: 6 }}>{active.result}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="site-page-content">
      <h1>Projets</h1>
      <h3>&amp; Infrastructure</h3>
      <br />
      <p>Cliquez sur un projet pour voir les détails.</p>
      <br />
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {PROJECTS.map((p) => (
          <div
            key={p.id}
            className="big-button-container"
            onMouseDown={() => setActive(p)}
          >
            <span style={{ fontSize: 36 }}>{p.icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1 style={{ fontSize: 32 }}>{p.title}</h1>
              <h3>{p.sub}</h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
