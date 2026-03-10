import React, { useMemo, useState, useEffect } from "react";
import {
  FlatList,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { WorkoutsStackParamList } from "../types/navigation";

type Exercise = {
  id: string;
  name: string;
  category: string;
};

type Props = {
  embedded?: boolean;
  onSelectExercise?: (exercise: Exercise) => void;
  onClose?: () => void;
};

const EXERCISES: Exercise[] = [
  { id: "1", name: "Push-up", category: "Bodyweight" },
  { id: "2", name: "Squat", category: "Legs" },
  { id: "3", name: "Bench Press", category: "Chest" },
];

export default function ChooseExerciseScreen({
  embedded = false,
  onSelectExercise,
  onClose,
}: Props) {
  const [query, setQuery] = useState("");
  const insets = useSafeAreaInsets();
  const [exercises, setExercises] = useState(EXERCISES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const BASE_URL = "http://localhost:8080";
  const navigation =
    useNavigation<NativeStackNavigationProp<WorkoutsStackParamList>>();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return exercises;
    return exercises.filter((e) => e.name.toLowerCase().includes(q));
  }, [query, exercises]);
  const createExercise = async (name: string, category: string) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("No session");

    const res = await fetch(`${BASE_URL}/api/exercises`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, category }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    return res.json();
  };

  const fetchExercises = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("No session");

    const res = await fetch(`${BASE_URL}/api/exercises`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    return res.json();
  };

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await fetchExercises();
        if (!active) return;
        setExercises(data);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Failed to load exercises"
        );
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-[#124559]">
      <View
        style={{ paddingTop: embedded ? 12 : insets.top + 12 }}
        className="px-5 pb-2 flex-row items-center justify-between"
      >
        <Text className="text-2xl font-bold text-[#eff6e0]">Choose Exercise</Text>
        <View className="flex-row items-center gap-2">
          {embedded && (
            <Pressable
              className="bg-[#01161e] px-4 py-2 rounded-full"
              onPress={onClose}
            >
              <Text className="text-[#eff6e0] font-bold">Back</Text>
            </Pressable>
          )}
          <Pressable
            className="bg-[#598392] px-4 py-2 rounded-full"
            onPress={() => setShowForm((prev) => !prev)}
          >
            <Text className="text-[#01161e] font-bold">New</Text>
          </Pressable>
        </View>
      </View>
      {showForm && (
        <View className="px-5 gap-2 mb-2">
          <TextInput
            placeholder="Exercise name"
            placeholderTextColor="#aec3b0"
            value={newName}
            onChangeText={setNewName}
            className="bg-[#eff6e0] border border-[#aec3b0] rounded-xl px-3 py-3 text-[#01161e]"
          />
          <TextInput
            placeholder="Category (e.g., Chest)"
            placeholderTextColor="#aec3b0"
            value={newCategory}
            onChangeText={setNewCategory}
            className="bg-[#eff6e0] border border-[#aec3b0] rounded-xl px-3 py-3 text-[#01161e]"
          />
          <Pressable
            className="bg-[#598392] py-2.5 rounded-xl items-center"
            onPress={async () => {
              if (!newName.trim()) return;
              const created = await createExercise(
                newName.trim(),
                newCategory.trim() || "Uncategorized"
              );
              setExercises((prev) => [created, ...prev]);
              setNewName("");
              setNewCategory("");
              setShowForm(false);
            }}
          >
            <Text className="text-[#01161e] font-bold">Add</Text>
          </Pressable>
        </View>
      )}

      <View className="px-5 py-3">
        <TextInput
          placeholder="Search exercises"
          placeholderTextColor="#aec3b0"
          value={query}
          onChangeText={setQuery}
          className="bg-[#eff6e0] border border-[#aec3b0] rounded-xl px-3 py-3 text-[#01161e]"
        />
      </View>

      {loading ? (
        <View className="px-5 pt-3">
          <Text className="text-sm font-semibold text-[#eff6e0]">
            Loading exercises...
          </Text>
        </View>
      ) : error ? (
        <View className="px-5 pt-3">
          <Text className="text-sm font-semibold text-[#eff6e0]">
            Couldn’t load exercises
          </Text>
          <Text className="mt-1 text-xs text-[#aec3b0]">{error}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-5 pb-6 gap-3"
          renderItem={({ item }) => (
            <Pressable
              className="bg-[#eff6e0] border border-[#aec3b0] rounded-xl p-4"
              onPress={() => {
                if (embedded && onSelectExercise) {
                  onSelectExercise(item);
                  return;
                }
                navigation.navigate("WorkoutDetail", {
                  selectedExercise: item,
                });
              }}
            >
              <Text className="text-base font-semibold text-[#01161e]">
                {item.name}
              </Text>
              <Text className="mt-1 text-xs text-[#124559]">
                {item.category}
              </Text>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
