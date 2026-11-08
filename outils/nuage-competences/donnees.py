"""
Données du nuage de compétences (page Compétences du portfolio).

Quatre familles de nœuds :
  · but     : les six compétences du programme national du BUT informatique ;
  · notion  : les grands thèmes des ressources du programme (BUT 1 et 2) ;
  · projet  : mes projets, formations et expériences ;
  · outil   : langages, frameworks, logiciels et méthodes.

Les liens disent « s'est servi de » (projet → outil), « relève de » (outil → notion,
notion → compétence) et « mobilise » (projet → compétence).
Pour ajouter un projet : une ligne dans PROJETS, puis relancer construire.sh.
"""

# Identifiant : (libellé français, libellé anglais)
BUT = {
    "c1": ("Réaliser", "Develop"),
    "c2": ("Optimiser", "Optimise"),
    "c3": ("Administrer", "Administer"),
    "c4": ("Gérer les données", "Manage data"),
    "c5": ("Conduire un projet", "Lead a project"),
    "c6": ("Collaborer", "Collaborate"),
}
# Intitulés complets (version texte, infobulles)
BUT_LONG = {
    "c1": ("Réaliser un développement d'application", "Develop an application"),
    "c2": ("Optimiser des applications", "Optimise applications"),
    "c3": ("Administrer des systèmes informatiques communicants complexes", "Administer complex networked systems"),
    "c4": ("Gérer des données de l'information", "Manage information data"),
    "c5": ("Conduire un projet", "Lead a project"),
    "c6": ("Collaborer au sein d'une équipe informatique", "Collaborate within an IT team"),
}

# Notions du programme : libellés, compétences dont elles relèvent
NOTIONS = {
    "algo":    ("Algorithmique", "Algorithms", ["c1", "c2"]),
    "poo":     ("Programmation objet", "Object-oriented programming", ["c1"]),
    "web":     ("Développement web", "Web development", ["c1"]),
    "ihm":     ("Interfaces (IHM)", "User interfaces", ["c1"]),
    "qualite": ("Qualité et tests", "Quality and testing", ["c1", "c2"]),
    "graphes": ("Graphes", "Graph theory", ["c2"]),
    "maths":   ("Mathématiques", "Mathematics", ["c2", "c4"]),
    "stats":   ("Statistiques", "Statistics", ["c4"]),
    "bdd":     ("Bases de données", "Databases", ["c4"]),
    "archi":   ("Architecture", "Computer architecture", ["c2", "c3"]),
    "os":      ("Systèmes d'exploitation", "Operating systems", ["c3"]),
    "reseau":  ("Réseaux", "Networking", ["c3"]),
    "gestion": ("Gestion de projet", "Project management", ["c5"]),
    "eco":     ("Économie durable", "Sustainable economy", ["c5"]),
    "com":     ("Communication", "Communication", ["c5", "c6"]),
    "ppp":     ("Projet professionnel", "Career planning", ["c6"]),
}

# Outils : libellés, notions ou compétences dont ils relèvent dans le programme
OUTILS = {
    "java":       ("Java", "Java", ["poo"]),
    "python":     ("Python", "Python", ["algo"]),
    "bash":       ("Bash", "Bash", ["os"]),
    "html":       ("HTML", "HTML", ["web"]),
    "css":        ("CSS", "CSS", ["web"]),
    "js":         ("JavaScript", "JavaScript", ["web"]),
    "php":        ("PHP", "PHP", ["web"]),
    "sql":        ("SQL", "SQL", ["bdd"]),
    "cobol":      ("COBOL", "COBOL", ["algo"]),
    "laravel":    ("Laravel", "Laravel", ["web"]),
    "react":      ("React", "React", ["web", "ihm"]),
    "flask":      ("Flask", "Flask", ["web"]),
    "javafx":     ("JavaFX", "JavaFX", ["ihm"]),
    "android":    ("Android", "Android", ["ihm"]),
    "mysql":      ("MySQL", "MySQL", ["bdd"]),
    "postgresql": ("PostgreSQL", "PostgreSQL", ["bdd"]),
    "mongodb":    ("MongoDB", "MongoDB", ["bdd"]),
    "api":        ("API REST", "REST API", ["web"]),
    "git":        ("Git", "Git", ["c6"]),
    "github":     ("GitHub", "GitHub", ["c6"]),
    "gitlab":     ("GitLab", "GitLab", ["c6"]),
    "docker":     ("Docker", "Docker", ["c3"]),
    "cicd":       ("CI/CD", "CI/CD", ["qualite", "c3"]),
    "gradle":     ("Gradle", "Gradle", ["qualite"]),
    "kvm":        ("KVM", "KVM", ["c3"]),
    "linux":      ("Linux", "Linux", ["os"]),
    "unix":       ("Unix", "Unix", ["os"]),
    "windows":    ("Windows", "Windows", ["os"]),
    "tcpip":      ("TCP/IP", "TCP/IP", ["reseau"]),
    "arduino":    ("Arduino", "Arduino", ["archi"]),
    "jupyter":    ("Jupyter", "Jupyter", ["stats"]),
    "junit":      ("JUnit", "JUnit", ["qualite"]),
    "mockito":    ("Mockito", "Mockito", ["qualite"]),
    "phpunit":    ("PHPUnit", "PHPUnit", ["qualite"]),
    "selenium":   ("Selenium", "Selenium", ["qualite"]),
    "cypress":    ("Cypress", "Cypress", ["qualite"]),
    "postman":    ("Postman", "Postman", ["qualite"]),
    "xray":       ("Xray", "Xray", ["qualite"]),
    "squash":     ("Squash", "Squash", ["qualite"]),
    "tdd":        ("TDD", "TDD", ["qualite"]),
    "jira":       ("Jira", "Jira", ["gestion"]),
    "confluence": ("Confluence", "Confluence", ["c6"]),
    "trello":     ("Trello", "Trello", ["gestion"]),
    "scrum":      ("Scrum", "Scrum", ["gestion"]),
    "kanban":     ("Kanban", "Kanban", ["gestion"]),
    "cyclev":     ("Cycle en V", "V-model", ["gestion"]),
    "merise":     ("Merise", "Merise", ["bdd"]),
    "uml":        ("UML", "UML", ["poo"]),
    "mvc":        ("MVC", "MVC", ["poo", "ihm"]),
    "figma":      ("Figma", "Figma", ["ihm"]),
    "photoshop":  ("Photoshop", "Photoshop", ["com"]),
    "indesign":   ("InDesign", "InDesign", ["com"]),
    "illustrator":("Illustrator", "Illustrator", ["com"]),
    "audiovideo": ("Audio, vidéo", "Audio, video", ["com"]),
    "markdown":   ("Markdown", "Markdown", ["com"]),
    "osm":        ("OpenStreetMap", "OpenStreetMap", ["bdd"]),
    "anglais":    ("Anglais", "English", ["c6"]),
    "espagnol":   ("Espagnol", "Spanish", ["c6"]),
}

# Projets et expériences : libellés, outils utilisés, compétences du BUT mobilisées
PROJETS = {
    "otaku":       ("Otaku List", "Otaku List", ["laravel", "php", "gitlab", "git"], ["c1", "c4", "c5", "c6"]),
    "space":       ("Space Invaders", "Space Invaders", ["java", "gitlab", "git"], ["c1", "c2", "c6"]),
    "voix":        ("Voix en image", "Voice to Image", ["python", "audiovideo"], ["c1", "c2"]),
    "toutpetits":  ("Carte des tout-petits", "Toddler Map", ["laravel", "php", "osm"], ["c1", "c4"]),
    "fractalens":  ("FractaLens", "FractaLens", ["java", "gradle", "junit", "scrum", "git"], ["c1", "c2", "c5", "c6"]),
    "geocodage":   ("Géocodage Flask", "Geocoding with Flask", ["python", "flask", "api"], ["c1", "c3"]),
    "caisse":      ("Caisse de food-truck", "Food-truck till", ["android", "flask", "postgresql", "api"], ["c1", "c3", "c4"]),
    "buxton":      ("Les Amis de Buxton", "Les Amis de Buxton", ["html", "css"], ["c1", "c5"]),
    "netsim":      ("Labo netsim", "netsim lab", ["kvm", "linux", "tcpip", "bash"], ["c3"]),
    "sante":       ("Centre Santé Bien-Être", "Centre Santé Bien-Être", ["java", "gradle", "uml"], ["c1", "c6"]),
    "todolist":    ("ToDoList+", "ToDoList+", ["javafx", "gradle"], ["c1"]),
    "resumecv":    ("resumeCV", "resumeCV", ["javafx", "mvc"], ["c1"]),
    "pacman":      ("Pac-Man", "Pac-Man", ["javafx", "java"], ["c1"]),
    "basedonnees": ("Base de données", "Database", ["postgresql", "sql", "merise", "docker"], ["c4"]),
    "scripts":     ("Scripts réseau", "Network scripts", ["bash", "tcpip", "linux"], ["c3"]),
    "graphes-p":   ("Graphes (SAÉ)", "Graphs (project)", ["python", "jupyter"], ["c2"]),
    "stats-p":     ("Statistiques (SAÉ)", "Statistics (project)", ["python", "jupyter"], ["c4"]),
    "portfolio1":  ("Portfolio BUT 1", "BUT 1 portfolio", ["markdown"], ["c6"]),
    "sae102":      ("SAÉ 1.02 algorithmes", "Project 1.02 algorithms", ["java", "python", "jupyter"], ["c2"]),
    "sae101":      ("SAÉ 1.01 notes", "Project 1.01 grades", ["java", "html"], ["c1"]),
    "byclowatt":   ("BycloWatt", "BycloWatt", ["html", "css", "js", "figma", "photoshop", "indesign", "illustrator", "audiovideo"], ["c1", "c5", "c6"]),
    "ceportfolio": ("Ce portfolio", "This portfolio", ["html", "css", "js", "git", "github", "python"], ["c1", "c6"]),
    "afpa-dev":    ("AFPA développement", "AFPA development", ["html", "css", "js", "php", "react", "mysql", "mongodb", "sql", "uml", "merise"], ["c1", "c4"]),
    "afpa-test":   ("AFPA test logiciel", "AFPA software testing", ["selenium", "cypress", "postman", "junit", "mockito", "phpunit", "jira", "xray", "squash", "tdd", "cyclev", "cicd"], ["c1", "c2"]),
    "worldline":   ("Mission Worldline", "Worldline assignment", ["jira", "confluence", "anglais"], ["c1", "c6"]),
    "robot":       ("Robot Arduino", "Arduino robot", ["arduino"], ["c1", "c3"]),
}
