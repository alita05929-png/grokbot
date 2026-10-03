"""Build site images from the GrokBot logo, banner, and new scenes."""
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
GEN = Path(r"C:\Users\Alita\.cursor\projects\e-pack-solana-grokbot\assets")

LOGO = ROOT / "logo.png"
BANNER = ROOT / "banner.png"


def save_png(im: Image.Image, path: Path) -> None:
    im.save(path, "PNG", optimize=True)
    print(f"{path.name:22} {im.size[0]}x{im.size[1]}  {path.stat().st_size}")


def resize(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), Image.Resampling.LANCZOS)


def key_green(path: Path) -> Image.Image:
    rgb = np.asarray(Image.open(path).convert("RGB"), dtype=np.float32)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    greenness = g - np.maximum(r, b)
    # JPEG green sits well above the white shell. Feather the edge.
    alpha = np.clip((28.0 - greenness) / 22.0, 0.0, 1.0)
    spill = np.clip(g - np.maximum(r, b), 0.0, None)
    g2 = np.clip(g - spill * np.clip(alpha, 0.15, 1.0), 0.0, 255.0)
    out = np.dstack([r, g2, b, alpha * 255.0]).astype(np.uint8)
    im = Image.fromarray(out, "RGBA")
    # Tighten a stray green fringe without eating the white shell.
    a = im.getchannel("A")
    a = a.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    im.putalpha(a)
    return im


def main() -> None:
    logo = Image.open(LOGO).convert("RGBA")
    banner = Image.open(BANNER).convert("RGB")

    save_png(resize(logo, 256), ASSETS / "logo-nav.png")
    save_png(resize(logo, 32), ASSETS / "favicon-32.png")
    save_png(resize(logo, 180), ASSETS / "apple-touch-icon.png")
    save_png(resize(logo, 512), ASSETS / "icon-512.png")

    banner.save(ASSETS / "banner.png", "PNG", optimize=True)
    print(f"{'banner.png':22} {banner.size[0]}x{banner.size[1]}  {(ASSETS / 'banner.png').stat().st_size}")

    bg = banner.resize((1200, 630), Image.Resampling.LANCZOS)
    bg = bg.filter(ImageFilter.GaussianBlur(18))
    bg = ImageEnhance.Brightness(bg).enhance(0.45)
    fitted = banner.copy()
    fitted.thumbnail((1120, 520), Image.Resampling.LANCZOS)
    plate = Image.new("RGB", (1200, 630))
    plate.paste(bg, (0, 0))
    plate.paste(fitted, ((1200 - fitted.width) // 2, (630 - fitted.height) // 2))
    og = ASSETS / "og.jpg"
    plate.save(og, "JPEG", quality=88, optimize=True)
    print(f"{'og.jpg':22} {plate.size[0]}x{plate.size[1]}  {og.stat().st_size}")

    mark = Image.open(GEN / "grokbot-mark.jpg").convert("RGB")
    mark = mark.resize((1024, 1024), Image.Resampling.LANCZOS)
    save_png(mark, ASSETS / "mark.png")

    portrait = Image.open(GEN / "grokbot-portrait.jpg").convert("RGB")
    portrait = portrait.resize((864, 1152), Image.Resampling.LANCZOS)
    save_png(portrait, ASSETS / "portrait.png")

    mascot = key_green(GEN / "grokbot-mascot-green.jpg")
    mascot = mascot.resize((1024, 1024), Image.Resampling.LANCZOS)
    save_png(mascot, ASSETS / "mascot.png")

    # Preview the keyed orb on a dark plate so the fringe is easy to check.
    preview = Image.new("RGBA", (1024, 1024), (7, 8, 20, 255))
    preview.alpha_composite(mascot)
    preview.convert("RGB").save(ASSETS / "_mascot-preview.jpg", "JPEG", quality=85)


if __name__ == "__main__":
    main()
