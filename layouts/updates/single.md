# {{ .Title }}

{{ with .Description }}> {{ . }}

{{ end }}Date: {{ .Date.Format "2006-01-02" }}
Source: {{ .Permalink }}

{{ with .Params.products }}## Changed products

{{ range . }}{{ $prod := index site.Data.products .slug }}- [{{ with $prod }}{{ .name }}{{ else }}{{ .slug }}{{ end }}]({{ $.Site.BaseURL }}products/{{ .slug }}/): {{ .change }}
{{ end }}{{ end }}
{{ with .Content }}{{ . | plainify | htmlUnescape }}{{ end }}
