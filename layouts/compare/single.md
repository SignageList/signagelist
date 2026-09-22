{{- $a := index site.Data.products .Params.a -}}
{{- $b := index site.Data.products .Params.b -}}
{{- $fa := partial "product/facts.html" $a -}}
{{- $fb := partial "product/facts.html" $b -}}
# {{ $a.name }} vs {{ $b.name }}

> {{ .Params.description }}

Source: {{ .Permalink }}

## {{ $a.name }}

{{ delimit (partial "product/summary.html" (dict "p" $a "facts" $fa)) " " }}

Profile: {{ .Site.BaseURL }}products/{{ $a.slug }}/

## {{ $b.name }}

{{ delimit (partial "product/summary.html" (dict "p" $b "facts" $fb)) " " }}

Profile: {{ .Site.BaseURL }}products/{{ $b.slug }}/

## Side by side

| | {{ $a.name }} | {{ $b.name }} |
| --- | --- | --- |
| Category | {{ delimit $a.categories ", " }} | {{ delimit $b.categories ", " }} |
| Headquarters | {{ delimit $a.headquarters ", " | default "-" }} | {{ delimit $b.headquarters ", " | default "-" }} |
| Founded | {{ with $a.year_founded }}{{ . }}{{ else }}-{{ end }} | {{ with $b.year_founded }}{{ . }}{{ else }}-{{ end }} |
| Platforms | {{ delimit $a.platforms ", " | default "-" }} | {{ delimit $b.platforms ", " | default "-" }} |
| Delivery | {{ delimit $fa.deliveries ", " | default "-" }} | {{ delimit $fb.deliveries ", " | default "-" }} |
| Lowest monthly plan | {{ if gt $fa.lowestMonthly 0.0 }}${{ printf "%g" $fa.lowestMonthly }}{{ else }}Not published{{ end }} | {{ if gt $fb.lowestMonthly 0.0 }}${{ printf "%g" $fb.lowestMonthly }}{{ else }}Not published{{ end }} |
| Free trial | {{ cond $fa.freeTrial "Yes" "No" }} | {{ cond $fb.freeTrial "Yes" "No" }} |
| Free tier | {{ cond $fa.freemium "Yes" "No" }} | {{ cond $fb.freemium "Yes" "No" }} |
| Open source | {{ cond $a.open_source "Yes" "No" }} | {{ cond $b.open_source "Yes" "No" }} |
| Self-signup | {{ cond $a.self_signup "Yes" "No" }} | {{ cond $b.self_signup "Yes" "No" }} |
| API | {{ cond $a.has_api "Yes" "No" }} | {{ cond $b.has_api "Yes" "No" }} |
| SSO | {{ cond $a.has_sso "Yes" "No" }} | {{ cond $b.has_sso "Yes" "No" }} |
| Website | {{ $a.website }} | {{ $b.website }} |

---

SignageList dataset © 514sid and contributors, licensed under ODbL v1.0.
