{{- $all := where site.RegularPages "Section" "products" -}}
{{- $free := slice -}}
{{- range $all }}{{ if or .Params.open_source .Params.has_freemium }}{{ $free = $free | append . }}{{ end }}{{ end -}}
{{- $oss := 0 -}}
{{- $freemium := 0 -}}
{{- range $free }}{{ if .Params.open_source }}{{ $oss = add $oss 1 }}{{ end }}{{ if .Params.has_freemium }}{{ $freemium = add $freemium 1 }}{{ end }}{{ end -}}
# {{ with .Params.seo_title }}{{ . }}{{ else }}Free and Freemium Digital Signage Software{{ end }}

> {{ .Params.description }}

{{ len $free }} of the {{ len $all }} products in the SignageList directory cost nothing to start with. {{ $oss }} are open source and free to self-host, and {{ $freemium }} offer a permanent free tier rather than only a trial.

Source: {{ .Permalink }}

## Products

{{ range sort $free "LinkTitle" }}- [{{ .Params.name }}]({{ .Permalink }}){{ if .Params.open_source }} (open source{{ with .Params.license }}, {{ . }}{{ end }}){{ else }} (free tier){{ end }}{{ with .Params.description }}: {{ . }}{{ end }}
{{ end }}
---

SignageList dataset © 514sid and contributors, licensed under ODbL v1.0.
