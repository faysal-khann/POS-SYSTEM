import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { PermissionNode } from "../services/userApi";

function collectIds(node: PermissionNode): number[] {
  return [node.id, ...node.children.flatMap(collectIds)];
}

function nodeMatchesSearch(node: PermissionNode, search: string): boolean {
  if (node.name.toLowerCase().includes(search.toLowerCase())) return true;
  return node.children.some((c) => nodeMatchesSearch(c, search));
}

function TreeNode({
  node,
  depth,
  selected,
  onToggle,
  search,
}: {
  node: PermissionNode;
  depth: number;
  selected: Set<number>;
  onToggle: (ids: number[], checked: boolean) => void;
  search: string;
}) {
  const [expanded, setExpanded] = useState(true);

  if (search && !nodeMatchesSearch(node, search)) return null;

  const allIds = collectIds(node);
  const childIds = node.children.flatMap(collectIds);
  const isChecked = selected.has(node.id);
  const someChildChecked = childIds.some((id) => selected.has(id));
  const allChildChecked = childIds.length > 0 && childIds.every((id) => selected.has(id));
  const indeterminate = !isChecked && someChildChecked && !allChildChecked;

  const iconName = isChecked || allChildChecked
    ? "checkbox"
    : indeterminate
    ? "remove-circle"
    : "square-outline";
  const iconColor = isChecked || allChildChecked || indeterminate ? "#3B82F6" : "#9CA3AF";

  return (
    <View>
      <View className="flex-row items-center py-1.5" style={{ paddingLeft: depth * 20 }}>
        {node.children.length > 0 && (
          <TouchableOpacity onPress={() => setExpanded(!expanded)} className="mr-1">
            <Ionicons
              name={expanded ? "chevron-down" : "chevron-forward"}
              size={14}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => onToggle(allIds, !(isChecked || allChildChecked))}
          className="flex-row items-center flex-1"
        >
          <Ionicons name={iconName as any} size={18} color={iconColor} />
          <Text className="text-sm text-gray-700 ml-2">{node.name}</Text>
        </TouchableOpacity>
      </View>

      {expanded &&
        node.children.map((child) => (
          <TreeNode
            key={child.id}
            node={child}
            depth={depth + 1}
            selected={selected}
            onToggle={onToggle}
            search={search}
          />
        ))}
    </View>
  );
}

export default function PermissionTree({
  tree,
  selected,
  onChange,
}: {
  tree: PermissionNode[];
  selected: Set<number>;
  onChange: (next: Set<number>) => void;
}) {
  const [search, setSearch] = useState("");

  const handleToggle = (ids: number[], checked: boolean) => {
    const next = new Set(selected);
    ids.forEach((id) => (checked ? next.add(id) : next.delete(id)));
    onChange(next);
  };

  return (
    <View>
      <View className="flex-row items-center border border-gray-200 rounded-xl px-3 mb-3 bg-gray-50">
        <Ionicons name="search" size={16} color="#9CA3AF" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search permissions..."
          placeholderTextColor="#9CA3AF"
          className="flex-1 ml-2 py-2.5 text-sm text-gray-800"
        />
      </View>

      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          selected={selected}
          onToggle={handleToggle}
          search={search}
        />
      ))}
    </View>
  );
}