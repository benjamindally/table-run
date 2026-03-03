import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { ChevronRight } from "lucide-react-native";

interface HorizontalTileScrollerProps<T> {
  title?: string;
  data: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  onItemPress?: (item: T) => void;
  seeAllText?: string;
  onSeeAllPress?: () => void;
  tileWidth?: number;
  emptyMessage?: string;
  getItemClassName?: (item: T) => string;
}

export function HorizontalTileScroller<T>({
  title,
  data,
  renderItem,
  keyExtractor,
  onItemPress,
  seeAllText = "See All",
  onSeeAllPress,
  tileWidth = 160,
  emptyMessage,
  getItemClassName,
}: HorizontalTileScrollerProps<T>) {
  if (data.length === 0 && !emptyMessage) {
    return null;
  }

  return (
    <View className="mb-4">
      {title && (
        <Text className="text-sm font-medium text-gray-500 mb-3">{title}</Text>
      )}
      {data.length === 0 && emptyMessage ? (
        <View className="py-4 items-center">
          <Text className="text-gray-400 text-sm">{emptyMessage}</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-1"
        >
          {data.map((item) => (
            <TouchableOpacity
              key={keyExtractor(item)}
              className={`rounded-lg p-3 mr-3 border ${getItemClassName ? getItemClassName(item) : "bg-gray-50 border-gray-200"}`}
              style={{ width: tileWidth }}
              onPress={() => onItemPress?.(item)}
              activeOpacity={onItemPress ? 0.7 : 1}
            >
              {renderItem(item)}
            </TouchableOpacity>
          ))}
          {onSeeAllPress && (
            <TouchableOpacity
              className="bg-gray-50 rounded-lg p-3 mr-3 border border-gray-200 items-center justify-center"
              style={{ width: tileWidth }}
              onPress={onSeeAllPress}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center gap-1">
                <Text className="text-primary font-semibold">{seeAllText}</Text>
                <ChevronRight color="#26A69A" size={18} />
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  );
}
