{{- $productCount := len (where site.RegularPages "Section" "products") -}}
# About SignageList

> {{ .Description }}

A curated, open directory of digital signage software: {{ $productCount }} products across {{ len site.Taxonomies.categories }} categories and {{ len site.Taxonomies.platforms }} playback platforms.

Source: {{ .Permalink }}

## Why this exists

SignageList started as a personal project to solve a recurring problem: there was no neutral, comprehensive place to compare digital signage software. Vendor sites are biased, review platforms are gated, and most lists are outdated or incomplete.

Every product here was researched and curated by hand, tracking pricing models, platform support, open-source status, founding years and more, so anyone evaluating digital signage software can start from a solid, unbiased foundation.

The data is open and the site is open source. Corrections and additions are welcome through GitHub.

## Curator

SignageList is created and maintained by 514sid, who works in the digital signage industry. Links: https://514sid.com and https://www.linkedin.com/in/514sid/

## How to contribute

Missing a product, or found an error? Open a pull request or use the issue template at {{ .Site.Params.githubRepo }}.

## Dataset

- Raw YAML records: {{ .Site.Params.githubRepo }}/tree/main/data/products
- Full directory as JSON: {{ .Site.BaseURL }}products.json
- Full directory as plain text: {{ .Site.BaseURL }}llms-full.txt
- License: Open Database License (ODbL) v1.0

Attribution: SignageList dataset © 514sid and contributors, licensed under ODbL v1.0.
