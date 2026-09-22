{{- $p := .Params -}}
{{- $f := partial "product/facts.html" $p -}}
{{- $summary := partial "product/summary.html" (dict "p" $p "facts" $f) -}}
{{- $faq := partial "product/faq.html" (dict "p" $p "facts" $f) -}}
# {{ $p.name }}

> {{ $p.description }}

{{ delimit $summary " " }}

Source: {{ .Permalink }}
{{ with $p.last_verified }}Last verified: {{ . }}
{{ end }}
## Key facts

| Field | Value |
| --- | --- |
| Name | {{ $p.name }} |
| Website | {{ $p.website }} |
| Categories | {{ delimit $p.categories ", " }} |
{{- with $p.headquarters }}{{ if gt (len .) 0 }}
| Headquarters | {{ delimit . ", " }} |
{{- end }}{{ end }}
{{- with $p.year_founded }}
| Founded | {{ . }} |
{{- end }}
| License | {{ if and $p.open_source $p.license }}{{ $p.license }} (open source){{ else if $p.open_source }}Open source{{ else }}Proprietary{{ end }} |
{{- with $p.source_code_url }}
| Source code | {{ . }} |
{{- end }}
{{- with $p.docs_url }}
| Documentation | {{ . }} |
{{- end }}
{{- with $p.developer_portal_url }}
| API documentation | {{ . }} |
{{- end }}
{{- with $f.deliveries }}
| Delivery | {{ delimit . ", " }} |
{{- end }}
| Self-signup | {{ if $p.self_signup }}Yes{{ else }}No{{ end }} |
| Free trial | {{ if $f.freeTrial }}Yes{{ else }}No{{ end }} |
| Free tier | {{ if $f.freemium }}Yes{{ else }}No{{ end }} |
| API | {{ if $p.has_api }}Yes{{ else }}No{{ end }} |
| CLI | {{ if $p.has_cli }}Yes{{ else }}No{{ end }} |
| MCP server | {{ if $p.has_mcp }}Yes{{ else }}No{{ end }} |
| SSO | {{ if $p.has_sso }}Yes{{ else }}No{{ end }} |
| SAML | {{ if $p.has_saml }}Yes{{ else }}No{{ end }} |
{{- with $f.certifications }}
| Compliance | {{ delimit . ", " }} |
{{- end }}
{{- with $p.stats }}{{ with .screens }}{{ with .total }}
| Active screens | {{ . }}+ |
{{- end }}{{ end }}{{ end }}
| Status | {{ if $p.discontinued }}Discontinued{{ else }}Active{{ end }} |

{{ with $p.platforms }}{{ if gt (len .) 0 }}
## Supported platforms

{{ range . }}- {{ . }} ({{ $.Site.BaseURL }}platforms/{{ . | urlize }}/)
{{ end }}{{ end }}{{ end }}
{{- range $p.models }}{{ if gt (len .pricing) 0 }}
## Pricing ({{ .delivery }})

| Plan | Monthly | Yearly | Billing basis | Payment model |
| --- | --- | --- | --- | --- |
{{ range .pricing }}| {{ .name }} | {{ with .monthly }}${{ . }}{{ else }}-{{ end }} | {{ with .yearly }}${{ . }}{{ else }}-{{ end }} | {{ replace .billing_basis "_" " " }} | {{ .payment_model }} |
{{ end }}
{{- else if not .pricing_available }}
## Pricing ({{ .delivery }})

Not published. Contact the vendor for a quote.
{{ end }}{{ end }}
{{- with $p.features }}{{ if gt (len .) 0 }}
## Features

{{ range . }}- {{ . }}
{{ end }}{{ end }}{{ end }}
{{- with $p.integrations }}{{ if gt (len .) 0 }}
## Integrations

{{ range . }}- {{ . }}
{{ end }}{{ end }}{{ end }}
{{- with $p.notes }}{{ if gt (len .) 0 }}
## Notes

{{ range . }}- {{ . }}
{{ end }}{{ end }}{{ end }}
## Frequently asked questions

{{ range $faq }}### {{ .q }}

{{ .a }}

{{ end }}
---

SignageList dataset © 514sid and contributors, licensed under ODbL v1.0. Source: {{ .Site.BaseURL }} Raw record: {{ .Site.Params.githubRepo }}/blob/main/data/products/{{ $p.slug }}.yaml
