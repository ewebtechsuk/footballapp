import os
import shutil
import time
from pathlib import Path
from typing import TYPE_CHECKING, Any, Dict, Optional

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.chrome.service import Service
    SELENIUM_AVAILABLE = True
    SELENIUM_IMPORT_ERROR: Optional[Exception] = None
except ModuleNotFoundError as exc:  # pragma: no cover - handles optional dependency
    webdriver = None  # type: ignore[assignment]
    Options = None  # type: ignore[assignment]
    Service = None  # type: ignore[assignment]
    SELENIUM_AVAILABLE = False
    SELENIUM_IMPORT_ERROR = exc

try:
    from webdriver_manager.chrome import ChromeDriverManager
    WEBDRIVER_MANAGER_AVAILABLE = True
    WEBDRIVER_MANAGER_ERROR: Optional[Exception] = None
except ModuleNotFoundError as exc:  # pragma: no cover - handles optional dependency
    ChromeDriverManager = None  # type: ignore[assignment]
    WEBDRIVER_MANAGER_AVAILABLE = False
    WEBDRIVER_MANAGER_ERROR = exc

if TYPE_CHECKING:
    from selenium.webdriver.chrome.webdriver import WebDriver as ChromeWebDriver
else:
    ChromeWebDriver = Any


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


def resolve_chrome_binary() -> Optional[str]:
    """Find a Chrome-compatible binary on the current system."""

    env_override = os.environ.get("CHROME_BINARY")
    if env_override:
        return env_override

    candidate_binaries = (
        "google-chrome",
        "google-chrome-stable",
        "chromium-browser",
        "/usr/bin/chromium-browser",
        "/usr/bin/google-chrome",
    )
    for candidate in candidate_binaries:
        binary = shutil.which(candidate) if not candidate.startswith("/") else candidate
        if binary and os.path.exists(binary):
            return binary
    return None


def create_driver() -> "ChromeWebDriver":
    if not SELENIUM_AVAILABLE:
        raise RuntimeError("Selenium is not installed") from SELENIUM_IMPORT_ERROR
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-software-rasterizer")
    chrome_binary = resolve_chrome_binary()
    if chrome_binary:
        options.binary_location = chrome_binary
    driver_path = os.environ.get("CHROMEDRIVER_PATH")
    if driver_path and not os.path.exists(driver_path):
        raise FileNotFoundError(f"Provided CHROMEDRIVER_PATH does not exist: {driver_path}")

    if not driver_path:
        driver_path = shutil.which("chromedriver") or "/usr/local/bin/chromedriver"

    if driver_path and os.path.exists(driver_path):
        service = Service(driver_path)
    else:
        if not WEBDRIVER_MANAGER_AVAILABLE:
            raise RuntimeError("webdriver-manager is not installed and chromedriver was not found") from WEBDRIVER_MANAGER_ERROR
        service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    driver.set_page_load_timeout(60)
    return driver


def capture_screenshot(driver: "ChromeWebDriver", name: str, url: str, output_dir: Path) -> None:
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


PLACEHOLDER_SVG_TEMPLATE = """<svg xmlns='http://www.w3.org/2000/svg' width='512' height='320'>
  <rect width='100%' height='100%' fill='#f4f4f5' />
  <text x='50%' y='45%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='28' fill='#18181b'>
    {title}
  </text>
  <text x='50%' y='60%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='16' fill='#3f3f46'>
    Placeholder screenshot
  </text>
  <text x='50%' y='72%' dominant-baseline='middle' text-anchor='middle' font-family='Arial, sans-serif' font-size='12' fill='#52525b'>
    {reason}
  </text>
</svg>
"""


def write_placeholder_image(output_dir: Path, name: str, reason: str) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    png_path = output_dir / f"{name}.png"
    if png_path.exists():
        print(f"Removing stale binary screenshot at {png_path}")
        png_path.unlink()

    svg_path = output_dir / f"{name}.svg"
    print(f"Writing placeholder illustration to {svg_path} ({reason})")
    svg_contents = PLACEHOLDER_SVG_TEMPLATE.format(title=name.replace("_", " ").title(), reason=reason)
    with open(svg_path, "w", encoding="utf-8") as handle:
        handle.write(svg_contents)

    note_path = svg_path.with_suffix(".txt")
    with open(note_path, "w", encoding="utf-8") as note_handle:
        note_handle.write(
            "Screenshot placeholder generated because the live site could not be captured.\n"
            f"Reason: {reason}\n"
        )


def main() -> None:
    output_dir = Path("screenshots")
    output_dir.mkdir(exist_ok=True)

    driver: Optional[ChromeWebDriver] = None
    driver_error: Optional[Exception] = None
    try:
        try:
            driver = create_driver()
        except Exception as exc:  # noqa: BLE001
            driver_error = exc
            print(f"Unable to initialise Chrome driver, falling back to placeholders: {exc}")

        for name, url in COMPETITOR_URLS.items():
            if not driver:
                reason = "web driver unavailable"
                if driver_error:
                    reason = f"{reason}: {driver_error}"
                write_placeholder_image(output_dir, name, reason)
                continue
            try:
                capture_screenshot(driver, name, url, output_dir)
            except Exception as exc:  # noqa: BLE001
                print(f"Failed to capture {name}: {exc}")
                write_placeholder_image(output_dir, name, str(exc))
    finally:
        if driver:
            driver.quit()


if __name__ == "__main__":
    main()
