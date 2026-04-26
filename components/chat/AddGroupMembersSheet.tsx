import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  SectionList,
  ActivityIndicator,
} from "react-native";
import { X, Check } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useColorScheme } from "nativewind";
import { useContacts } from "@/context/ContactsContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { Contact } from "@/lib/mocks/contactsStore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SearchInput from "@/components/ui/SearchInput";

interface AddGroupMembersSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingMemberIds: string[];
  onAddMembers: (contacts: Contact[]) => void;
}

export function AddGroupMembersSheet({
  open,
  onOpenChange,
  existingMemberIds,
  onAddMembers,
}: AddGroupMembersSheetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === "dark";
  const { contacts } = useContacts();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAdding, setIsAdding] = useState(false);

  const existingSet = useMemo(() => new Set(existingMemberIds), [existingMemberIds]);

  const availableContacts = useMemo(() => {
    return contacts.filter((c) => !existingSet.has(c.id));
  }, [contacts, existingSet]);

  const filteredContacts = availableContacts.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sections = useMemo(() => {
    const groups: { [key: string]: Contact[] } = {};
    filteredContacts.forEach((c) => {
      const char = (c.name?.[0] || "#").toUpperCase();
      if (!groups[char]) groups[char] = [];
      groups[char].push(c);
    });
    return Object.keys(groups)
      .sort()
      .map((char) => ({ title: char, data: groups[char] }));
  }, [filteredContacts]);

  const toggleSelect = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAdd = async () => {
    if (selectedIds.size === 0) return;
    setIsAdding(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Slight delay for better UX feel
    await new Promise(r => setTimeout(r, 600));
    
    const selectedContacts = contacts.filter((c) => selectedIds.has(c.id));
    onAddMembers(selectedContacts);
    setIsAdding(false);
    onOpenChange(false);
    setSelectedIds(new Set());
    setSearchQuery("");
  };

  const selectedContactsCount = selectedIds.size;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] h-[80%] p-0 overflow-hidden" onOpenChange={onOpenChange}>
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border/10">
          <View className="flex-row items-center justify-between">
            <DialogTitle className="lowercase">add members</DialogTitle>
            <Pressable 
              onPress={() => onOpenChange(false)}
              className="w-8 h-8 items-center justify-center rounded-full bg-muted/50"
            >
              <X size={20} color={isDark ? "#AAA" : "#666"} />
            </Pressable>
          </View>
        </DialogHeader>

        <View className="px-4 py-3">
          <SearchInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search contacts..."
          />
        </View>

        {selectedIds.size > 0 && (
          <View className="px-4 py-2 bg-muted/20 border-b border-border/5">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {availableContacts.filter(c => selectedIds.has(c.id)).map(c => (
                <View key={c.id} className="mr-3 items-center">
                  <Pressable onPress={() => toggleSelect(c.id)} className="relative">
                    <Avatar className="w-10 h-10 border border-border/20" alt={""}>
                      <AvatarImage src={c.avatarUrl} />
                      <AvatarFallback>
                        <Text className="text-xs font-inter-bold">{c.name[0]}</Text>
                      </AvatarFallback>
                    </Avatar>
                    <View className="absolute -top-1 -right-1 bg-muted-foreground rounded-full w-4 h-4 items-center justify-center border border-background">
                      <X size={10} color="white" />
                    </View>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          stickySectionHeadersEnabled
          className="flex-1"
          renderSectionHeader={({ section: { title } }) => (
            <View className="bg-muted/40 px-4 py-1">
              <Text className="text-[12px] font-inter-bold text-muted-foreground uppercase">{title}</Text>
            </View>
          )}
          renderItem={({ item }) => {
            const isSelected = selectedIds.has(item.id);
            return (
              <Pressable
                onPress={() => toggleSelect(item.id)}
                className="flex-row items-center px-4 py-3 active:bg-muted/30"
              >
                <Avatar alt={item.name} className="w-11 h-11">
                  <AvatarImage src={item.avatarUrl} />
                  <AvatarFallback>
                    <Text className="font-inter-bold">{item.name[0]}</Text>
                  </AvatarFallback>
                </Avatar>
                <View className="flex-1 ml-3">
                  <Text className="text-[16px] font-inter-semibold text-foreground">{item.name}</Text>
                  <Text className="text-[13px] text-muted-foreground" numberOfLines={1}>
                    {item.status || "Konekta user"}
                  </Text>
                </View>
                <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                }`}>
                  {isSelected && <Check size={14} color="white" strokeWidth={4} />}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20 px-8">
              <Text className="text-muted-foreground text-center">
                {searchQuery ? "No contacts found matching your search" : "No more contacts to add"}
              </Text>
            </View>
          }
        />

        <View className="p-4 bg-background border-t border-border/10">
          <Pressable
            onPress={handleAdd}
            disabled={selectedIds.size === 0 || isAdding}
            className={`h-14 rounded-2xl items-center justify-center shadow-lg ${
              selectedIds.size > 0 ? "bg-primary" : "bg-muted"
            }`}
          >
            {isAdding ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className={`font-inter-bold text-[17px] ${selectedIds.size > 0 ? "text-primary-foreground" : "text-muted-foreground"}`}>
                Add {selectedContactsCount > 0 ? `${selectedContactsCount} Members` : "Members"}
              </Text>
            )}
          </Pressable>
        </View>
      </DialogContent>
    </Dialog>
  );
}
