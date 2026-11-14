{{ $p := .Params }}{{ $l := partial "incident/labels.html" $p }}# {{ .Title }}

- Date: {{ $p.incident_date }}
- Location: {{ $p.location }}
- Type: {{ $l.type }}
- Sector: {{ $l.sector }}
{{- with $p.cve }}
- CVE: {{ delimit . ", " }}
{{- end }}
{{- with $p.related_products }}
- Products: {{ range $i, $s := . }}{{ if $i }}, {{ end }}{{ with site.GetPage (printf "/products/%s" $s) }}[{{ .Params.name }}]({{ .Permalink }}){{ end }}{{ end }}
{{- end }}

{{ $p.summary }}

## Sources

{{ range $p.sources }}- [{{ .title | default .url }}]({{ .url }}){{ with .publisher }} ({{ . }}){{ end }}
{{ end }}
Page: {{ .Permalink }}
