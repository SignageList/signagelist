# {{ .Title }}

{{ with .Description }}> {{ . }}

{{ end }}Source: {{ .Permalink }}

{{ with .Content }}{{ . | plainify | htmlUnescape }}

{{ end }}{{ with .Pages }}## Pages

{{ range . }}- [{{ .Title }}]({{ .Permalink }}){{ with .Description }}: {{ . }}{{ end }}
{{ end }}{{ end }}
