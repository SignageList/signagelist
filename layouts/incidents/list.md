# {{ .Title }}

> {{ .Description }}

Source: {{ .Permalink }}

{{ range (sort .Pages "Date" "desc") }}{{ $l := partial "incident/labels.html" .Params }}## {{ .Params.incident_date }}: {{ .Title }}

{{ .Params.location }} · {{ $l.type }}

{{ .Params.summary }}

Sources: {{ range $i, $s := .Params.sources }}{{ if $i }}, {{ end }}[{{ $s.publisher | default "source" }}]({{ $s.url }}){{ end }}

{{ end }}
