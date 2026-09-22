# {{ .Title }}

{{ with .Description }}> {{ . }}

{{ end }}Source: {{ .Permalink }}
{{ with .Date }}{{ if not .IsZero }}Date: {{ .Format "2006-01-02" }}
{{ end }}{{ end }}
{{ with .Content }}{{ . | plainify | htmlUnescape }}{{ end }}
