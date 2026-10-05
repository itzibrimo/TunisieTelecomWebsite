export const NAV_LINKS = [
  { href: "/", label: "Accueil" },
  { href: "/about", label: "À propos" },
  { href: "/services", label: "Services" },
  { href: "/contact", label: "Contact" },
] as const;

export const SERVICES = [
  { id: "mobile", title: "Mobile", subtitle: "Forfaits & appels", icon: "smartphone", href: "/services" },
  { id: "internet", title: "Internet Fixe", subtitle: "Fibre & ADSL", icon: "wifi", href: "/services" },
  { id: "tv", title: "TV & Divertissement", subtitle: "Chaînes & streaming", icon: "tv", href: "/services" },
  { id: "assistance", title: "Assistance", subtitle: "Support 24/7", icon: "headphones", href: "/contact" },
  { id: "espace-client", title: "Espace Client", subtitle: "Gérer votre compte", icon: "user", href: "/login" },
  { id: "entreprise", title: "Entreprise", subtitle: "Solutions B2B", icon: "building", href: "/services" },
] as const;

export const STATS = [
  { value: 6, suffix: "M+", label: "Clients actifs" },
  { value: 99.9, suffix: "%", label: "Disponibilité réseau" },
  { value: 24, suffix: "/7", label: "Support technique" },
  { value: 50, suffix: "+", label: "Agences en Tunisie" },
] as const;

export const TESTIMONIALS = [
  { name: "Ahmed Ben Ali", role: "Directeur IT", text: "TT Digital a transformé notre infrastructure réseau.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80" },
  { name: "Sara Mansouri", role: "Entrepreneure", text: "Le support client est exceptionnel.", image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80" },
  { name: "Karim Jaziri", role: "Gérant", text: "Un vrai plus pour notre activité.", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80" },
] as const;

export const TT_OFFERS = [
  { id: "fancy-s", title: "FANCY S", price: "15.9", unit: "TND/mois", data: "30 Go", calls: "Illimités", sms: "Illimités", badge: "Populaire" },
  { id: "fancy-m", title: "FANCY M", price: "25.9", unit: "TND/mois", data: "80 Go", calls: "Illimités", sms: "Illimités", badge: "Meilleur choix" },
  { id: "fancy-l", title: "FANCY L", price: "39.9", unit: "TND/mois", data: "200 Go", calls: "Illimités", sms: "Illimités", badge: "Premium" },
  { id: "fibre-rapido", title: "Fibre Rapido", price: "49.9", unit: "TND/mois", data: "Illimité", calls: "Fixe illimité", sms: "—", badge: "Fibre" },
  { id: "big-bonus", title: "Big Bonus", price: "9.9", unit: "TND/mois", data: "10 Go", calls: "500 min", sms: "500", badge: "Économique" },
  { id: "ehdia-net", title: "Ehdia Net", price: "19.9", unit: "TND/mois", data: "50 Go", calls: "Illimités", sms: "Illimités", badge: "Internet" },
] as const;

export const COUNTRIES = [
  "Algérie", "Allemagne", "Arabie Saoudite", "Belgique", "Canada", "Corée du Sud",
  "Danemark", "Espagne", "États-Unis", "France", "Grèce", "Irak", "Italie",
  "Japon", "Libye", "Maroc", "Norvège", "Pays-Bas", "Qatar", "Royaume-Uni",
  "Suède", "Suisse", "Tunisie", "Turquie", "Émirats", "Égypte",
] as const;

// Les 24 gouvernorats de Tunisie
export const TUNISIAN_GOVERNORATES: readonly string[] = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul",
  "Zaghouan",
  "Bizerte",
  "Béja",
  "Jendouba",
  "Le Kef",
  "Siliana",
  "Sousse",
  "Monastir",
  "Mahdia",
  "Kairouan",
  "Kasserine",
  "Sidi Bouzid",
  "Sfax",
  "Gabès",
  "Médenine",
  "Tataouine",
  "Gafsa",
  "Tozeur",
  "Kebili",
];

export const FOOTER_SECTIONS = {
  apropos: {
    title: "À propos",
    links: [
      { label: "Actualités", href: "#" },
      { label: "Stages", href: "#" },
      { label: "Accès à l'information", href: "#" },
    ],
  },
  myTt: {
    title: "My TT",
    links: [
      { label: "Recharge TT Cash", href: "/tt-cash" },
      { label: "Achat Internet", href: "/offres" },
      { label: "Paiement Facture", href: "/factures" },
      { label: "Transfert", href: "#" },
      { label: "Inscription e-Facture", href: "/efacture" },
    ],
  },
  myTtBusiness: {
    title: "My TT Business",
    links: [
      { label: "Inscription", href: "/signup" },
      { label: "Suivi de consommation", href: "#" },
      { label: "Paiement des factures", href: "/factures" },
      { label: "Recharge TT Cash", href: "/tt-cash" },
    ],
  },
  assistance: {
    title: "Assistance",
    links: [
      { label: "TT près de chez vous", href: "#" },
      { label: "Couverture Réseau", href: "/aide" },
      { label: "Réclamation", href: "/support" },
      { label: "Tutos", href: "#" },
      { label: "Pages Jaunes", href: "#" },
    ],
  },
  notreEntreprise: {
    title: "Notre Entreprise",
    links: [
      { label: "Appels d'offres", href: "#" },
      { label: "Règlement interne des achats", href: "#" },
    ],
  },
} as const;
