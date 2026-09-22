{{- $products := (.Site.GetPage "/products").Pages -}}
{{- $active := where $products "Params.discontinued" "!=" true -}}
# {{ .Site.Title }}

> {{ .Site.Params.description }}

SignageList catalogues {{ len $products }} digital signage products ({{ len $active }} active), each with structured data on pricing, supported playback platforms, delivery model, headquarters, licensing, and developer surface. Every listing is maintained by hand from vendor sources.

Last updated: {{ .Site.Lastmod.Format "2006-01-02" }}

## Machine-readable entry points

- Directory index for LLMs: {{ .Site.BaseURL }}llms.txt
- Every product as one text file: {{ .Site.BaseURL }}llms-full.txt
- Whole dataset as JSON: {{ .Site.BaseURL }}products.json
- Raw YAML records: {{ .Site.Params.githubRepo }}/tree/main/data/products
- Sitemap: {{ .Site.BaseURL }}sitemap.xml

Every page on this site has a Markdown twin at the same URL plus `index.md`. For example, {{ .Site.BaseURL }}products/screenly/ is also available at {{ .Site.BaseURL }}products/screenly/index.md.

## Categories

{{ range $name, $terms := .Site.Taxonomies.categories }}{{ with $.Site.GetPage (printf "/categories/%s" $name) }}- [{{ .Title }}]({{ .Permalink }}): {{ len $terms }} products{{ with .Params.description }}. {{ . }}{{ end }}
{{ end }}{{ end }}
## Platforms

{{ range $name, $terms := .Site.Taxonomies.platforms }}{{ with $.Site.GetPage (printf "/platforms/%s" $name) }}- [{{ .Title }}]({{ .Permalink }}): {{ len $terms }} products
{{ end }}{{ end }}
## Other pages

- [Free and freemium products]({{ .Site.BaseURL }}free/)
- [Industry news]({{ .Site.BaseURL }}news/)
- [Directory changelog]({{ .Site.BaseURL }}updates/)
- [About]({{ .Site.BaseURL }}about/)

## All products

{{ range $products.ByTitle }}- [{{ .Params.name }}]({{ .Permalink }}){{ if .Params.discontinued }} (discontinued){{ end }}{{ with .Params.description }}: {{ . }}{{ end }}
{{ end }}
---

SignageList dataset © 514sid and contributors, licensed under ODbL v1.0.
