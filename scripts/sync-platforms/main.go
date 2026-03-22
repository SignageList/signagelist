// Ensures Android ↔ Fire OS platform symmetry across all product YAML files.
// If a product supports Android but not Fire OS (or vice versa), the missing
// platform is added. Run as a pre-build step: go run ./scripts/sync-platforms/
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"slices"

	"gopkg.in/yaml.v3"
)

const (
	platformAndroid = "Android"
	platformFireOS  = "Fire OS"
)

func main() {
	dir := "data/products"
	if len(os.Args) > 1 {
		dir = os.Args[1]
	}

	files, err := filepath.Glob(filepath.Join(dir, "*.yaml"))
	if err != nil || len(files) == 0 {
		fmt.Fprintf(os.Stderr, "no product YAML files found in %s\n", dir)
		os.Exit(1)
	}

	modified := 0
	for _, f := range files {
		changed, err := processFile(f)
		if err != nil {
			fmt.Fprintf(os.Stderr, "error: %s: %v\n", f, err)
			continue
		}
		if changed {
			modified++
			fmt.Printf("updated: %s\n", f)
		}
	}
	fmt.Printf("%d file(s) updated\n", modified)
}

func processFile(path string) (bool, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return false, err
	}

	var doc yaml.Node
	if err := yaml.Unmarshal(data, &doc); err != nil {
		return false, fmt.Errorf("parse: %w", err)
	}

	if doc.Kind != yaml.DocumentNode || len(doc.Content) == 0 {
		return false, nil
	}
	mapping := doc.Content[0]
	if mapping.Kind != yaml.MappingNode {
		return false, nil
	}

	var platformsNode *yaml.Node
	for i := 0; i+1 < len(mapping.Content); i += 2 {
		if mapping.Content[i].Value == "platforms" {
			platformsNode = mapping.Content[i+1]
			break
		}
	}

	if platformsNode == nil || platformsNode.Kind != yaml.SequenceNode {
		return false, nil
	}

	current := make([]string, 0, len(platformsNode.Content))
	for _, n := range platformsNode.Content {
		current = append(current, n.Value)
	}

	hasAndroid := slices.Contains(current, platformAndroid)
	hasFireOS := slices.Contains(current, platformFireOS)

	var toAdd []string
	if hasAndroid && !hasFireOS {
		toAdd = append(toAdd, platformFireOS)
	}
	if hasFireOS && !hasAndroid {
		toAdd = append(toAdd, platformAndroid)
	}
	if len(toAdd) == 0 {
		return false, nil
	}

	for _, p := range toAdd {
		platformsNode.Style = 0 // ensure block style
		platformsNode.Content = append(platformsNode.Content, &yaml.Node{
			Kind:  yaml.ScalarNode,
			Tag:   "!!str",
			Value: p,
		})
	}

	out, err := yaml.Marshal(&doc)
	if err != nil {
		return false, fmt.Errorf("marshal: %w", err)
	}
	if err := os.WriteFile(path, out, 0644); err != nil {
		return false, fmt.Errorf("write: %w", err)
	}
	return true, nil
}
