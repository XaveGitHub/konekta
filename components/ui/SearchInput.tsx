import { Icon } from "@/components/ui/icon";
import { SearchIcon } from "lucide-react-native";
import { TextInput, View } from "react-native";

type Props = {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
};

export default function SearchInput({ placeholder = "Search", value, onChangeText }: Props) {
  return (
    <View className="flex-row items-center rounded-full bg-muted px-4 min-h-[44px]">
      <Icon as={SearchIcon} size={20} className="text-muted-foreground mr-2" />
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="rgba(148, 163, 184, 1)"
        className="flex-1 text-[17px] text-foreground leading-tight p-0 m-0"
        style={{ paddingVertical: 10 }}
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}
