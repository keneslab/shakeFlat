<?php
namespace shakeFlat;

class WebFontLoader
{
    private static $instance = null;
    private $config;

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct()
    {
        $this->config = SHAKEFLAT_ENV;
    }

    public function generateStyle()
    {
        $style = "";
        $useWebfonts = $this->config["font_loader"]["use_webfonts"] ?? [];

        if ($useWebfonts) {
            $style .= "<style>\n";
            foreach ($useWebfonts as $fontName) {
                $fontData = $this->config["webfont"][$fontName] ?? null;
                if ($fontData && isset($fontData["face"])) {
                    foreach ($fontData["face"] as $face) {
                        $style .= "@font-face {\n";
                        if (isset($face["family"])) $style .= "    font-family: '{$face['family']}';\n";
                        if (isset($face["weight"])) $style .= "    font-weight: {$face['weight']};\n";
                        if (isset($face["style"])) $style .= "    font-style: {$face['style']};\n";
                        if (isset($face["display"])) $style .= "    font-display: {$face['display']};\n";

                        if (isset($face["src"])) {
                            $srcs = [];
                            foreach ($face["src"] as $src) {
                                $srcStr = "url('{$src['url']}')";
                                if (isset($src["format"])) {
                                    $srcStr .= " format('{$src['format']}')";
                                }
                                $srcs[] = $srcStr;
                            }
                            $style .= "    src: " . implode(",\n         ", $srcs) . ";\n";
                        }
                        $style .= "}\n";
                    }
                }
            }
            $style .= "    </style>\n";
        }

        $useIconfonts = $this->config["font_loader"]["use_iconfonts"] ?? [];
        if ($useIconfonts) {
            foreach ($useIconfonts as $iconName) {
                $iconData = $this->config["icon"][$iconName] ?? null;
                if ($iconData && isset($iconData["css"])) {
                    $style .= "<link rel=\"stylesheet\" href=\"{$iconData['css']}\">\n";
                }
            }
        }

        return $style;
    }

    public function generatePreload()
    {
        $preload = "";
        $useWebfonts = $this->config["font_loader"]["use_webfonts"] ?? [];
        if ($useWebfonts) {
            foreach ($useWebfonts as $fontName) {
                $fontData = $this->config["webfont"][$fontName] ?? null;
                if ($fontData && isset($fontData["preload"]) && $fontData["preload"] == true) {
                    if (isset($fontData["face"])) {
                        foreach ($fontData["face"] as $face) {
                            if (isset($face["src"])) {
                                foreach ($face["src"] as $src) {
                                    if (strpos($src["url"], ".woff2") !== false) {
                                        $preload .= "<link rel=\"preload\" href=\"{$src['url']}\" as=\"font\" type=\"font/woff2\" crossorigin>\n";
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        $useIconfonts = $this->config["font_loader"]["use_iconfonts"] ?? [];
        if ($useIconfonts) {
            foreach ($useIconfonts as $iconName) {
                $iconData = $this->config["icon"][$iconName] ?? null;
                if ($iconData && isset($iconData["preload"]) && $iconData["preload"] == true && isset($iconData["url"])) {
                    $preload .= "<link rel=\"preload\" href=\"{$iconData['url']}\" as=\"font\" type=\"font/woff2\" crossorigin>\n";
                }
            }
        }

        return $preload;
    }
}

