import argparse
import os
import shutil
import socket
import subprocess
import sys
import time
import webbrowser
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen


def executer_commande(commande: list[str], dossier_travail: Path | None = None) -> None:
    resultat = subprocess.run(commande, cwd=dossier_travail, check=False)
    if resultat.returncode != 0:
        raise RuntimeError(f"Commande échouée ({resultat.returncode}): {' '.join(commande)}")


def resoudre_commande(nom: str) -> str:
    candidats = [nom]
    if sys.platform.startswith("win"):
        candidats = [f"{nom}.cmd", f"{nom}.exe", nom]
    for candidat in candidats:
        if shutil.which(candidat):
            return candidat
    raise RuntimeError(f"'{nom}' est introuvable dans le PATH.")


def dependances_npm_installees(commande_npm: str, dossier_projet: Path) -> bool:
    if not (dossier_projet / "node_modules").exists():
        return False
    resultat = subprocess.run(
        [commande_npm, "ls", "--depth=0"],
        cwd=dossier_projet,
        check=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return resultat.returncode == 0


def port_libre(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as socket_test:
        socket_test.settimeout(0.5)
        return socket_test.connect_ex(("127.0.0.1", port)) != 0


def choisir_port(debut: int = 3000, fin: int = 3020) -> int:
    for port in range(debut, fin + 1):
        if port_libre(port):
            return port
    raise RuntimeError(f"Aucun port libre entre {debut} et {fin}.")


def attendre_serveur(url: str, delai_secondes: int = 120) -> None:
    debut = time.time()
    while time.time() - debut < delai_secondes:
        try:
            with urlopen(url, timeout=3) as reponse:
                if 200 <= reponse.status < 500:
                    return
        except (URLError, TimeoutError, socket.timeout):
            time.sleep(1)
    raise RuntimeError(f"Le serveur n'a pas répondu sur {url} après {delai_secondes}s.")


def arreter_next_dev_existant(dossier_projet: Path) -> None:
    if not sys.platform.startswith("win"):
        return
    dossier_echappe = str(dossier_projet)
    commande_ps = (
        "Get-CimInstance Win32_Process -Filter \"name = 'node.exe'\" "
        f"| Where-Object {{ $_.CommandLine -and $_.CommandLine -like '*next*dev*' -and $_.CommandLine -like '*{dossier_echappe}*' }} "
        "| Select-Object -ExpandProperty ProcessId"
    )
    resultat = subprocess.run(
        ["powershell", "-NoProfile", "-Command", commande_ps],
        check=False,
        capture_output=True,
        text=True,
    )
    if resultat.returncode != 0:
        return
    identifiants_processus: list[int] = []
    for ligne in (resultat.stdout or "").splitlines():
        valeur = ligne.strip()
        if valeur.isdigit():
            identifiants_processus.append(int(valeur))
    if not identifiants_processus:
        return
    print(f"[2.2/3] Arrêt de {len(identifiants_processus)} ancien(s) processus Next.js dev...")
    for identifiant in identifiants_processus:
        subprocess.run(["taskkill", "/PID", str(identifiant), "/F"], check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1)


def main() -> None:
    analyseur = argparse.ArgumentParser(description="Lance Next.js (frontend + API) et ouvre le navigateur.")
    analyseur.add_argument("--check-only", action="store_true", help="Vérifie uniquement les prérequis.")
    analyseur.add_argument("--no-open", action="store_true", help="N'ouvre pas automatiquement le navigateur.")
    arguments = analyseur.parse_args()

    dossier_racine = Path(__file__).resolve().parent
    dossier_projet = dossier_racine / "interface_front_end"
    if not (dossier_projet / "package.json").exists():
        raise RuntimeError("package.json introuvable dans interface_front_end.")

    port = choisir_port()
    url_site = f"http://localhost:{port}"

    print("[1/3] Vérification des dépendances système...")
    commande_python = resoudre_commande("python")
    commande_node = resoudre_commande("node")
    commande_npm = resoudre_commande("npm")
    executer_commande([commande_python, "--version"])
    executer_commande([commande_node, "--version"])
    executer_commande([commande_npm, "--version"])

    if arguments.check_only:
        print("Vérifications OK. Aucun service n'a été lancé (--check-only).")
        return

    if dependances_npm_installees(commande_npm, dossier_projet):
        print("[2/3] Dépendances npm déjà installées, aucune réinstallation nécessaire.")
    else:
        print("[2/3] Installation des dépendances npm...")
        executer_commande([commande_npm, "install"], dossier_travail=dossier_projet)

    arreter_next_dev_existant(dossier_projet)

    print(f"[3/3] Démarrage du serveur Next.js (frontend + API) sur le port {port}...")
    env = os.environ.copy()
    env["NEXT_PUBLIC_BACKEND_URL"] = f"http://127.0.0.1:{port}/api"
    serveur = subprocess.Popen([commande_npm, "run", "dev", "--", "-p", str(port)], cwd=dossier_projet, env=env)

    try:
        attendre_serveur(url_site)
        attendre_serveur(f"http://127.0.0.1:{port}/api/health")
        print(f"API Next.js prête sur http://127.0.0.1:{port}/api")
        print(f"Serveur prêt sur {url_site}")
        if not arguments.no_open:
            webbrowser.open(url_site)
            print("Navigateur ouvert.")
        print("Appuie sur Ctrl+C pour arrêter le serveur.")
        serveur.wait()
    except KeyboardInterrupt:
        print("\nArrêt demandé par l'utilisateur...")
    finally:
        if serveur.poll() is None:
            serveur.terminate()
            try:
                serveur.wait(timeout=10)
            except subprocess.TimeoutExpired:
                serveur.kill()
        print("Serveur arrêté.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nInterruption demandée. Script arrêté proprement.")
        sys.exit(130)
    except Exception as exc:
        print(f"Erreur: {exc}")
        sys.exit(1)
