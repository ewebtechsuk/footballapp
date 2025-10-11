import os
import time
from pathlib import Path
from typing import Dict

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager


COMPETITOR_URLS: Dict[str, str] = {
    "ryval": "https://www.ryval.app/",
    "footyaddicts": "https://footyaddicts.com/",
    "ftplay": "https://www.ftplayapp.com/",
    "matchup": "https://www.matchupapp.co/",
    "squaded": "https://www.squaded.app/",
    "teamstats": "https://www.teamstats.net/",
    "findaplayer": "https://findaplayer.com/",
    "firstwhistle": "https://www.firstwhistle.app/",
    "mynextfootballteam": "https://www.mynextfootballteam.com/",
}


def create_driver() -> webdriver.Chrome:
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-dev-shm-usage")
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.set_page_load_timeout(60)
    return driver


def capture_screenshot(driver: webdriver.Chrome, name: str, url: str, output_dir: Path) -> None:
    print(f"Navigating to {url}...")
    driver.get(url)
    time.sleep(5)

    scroll_height = driver.execute_script("return document.body.scrollHeight")
    last_height = 0
    while scroll_height != last_height:
        last_height = scroll_height
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        time.sleep(2)
        scroll_height = driver.execute_script("return document.body.scrollHeight")

    driver.set_window_size(1920, scroll_height + 200)
    time.sleep(1)

    output_path = output_dir / f"{name}.png"
    print(f"Saving screenshot to {output_path}")
    if not output_path.parent.exists():
        output_path.parent.mkdir(parents=True, exist_ok=True)
    driver.save_screenshot(str(output_path))


def main() -> None:
    output_dir = Path("screenshots")
    output_dir.mkdir(exist_ok=True)

    driver = create_driver()
    try:
        for name, url in COMPETITOR_URLS.items():
            try:
                capture_screenshot(driver, name, url, output_dir)
            except Exception as exc:  # noqa: BLE001
                print(f"Failed to capture {name}: {exc}")
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
