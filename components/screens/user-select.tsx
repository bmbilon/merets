import { useState } from "react";
import { View, ScrollView, TouchableOpacity, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Provider as PaperProvider,
  Text,
  Avatar,
  Surface,
} from "react-native-paper";
import { notifyUserSwitch } from "@/lib/user-events";

type User = "aveya" | "onyx" | "lauren" | "brett";

const USER_KEY = "selected_user";

const users = [
  {
    id: "aveya" as User,
    name: "Aveya",
    age: 15,
    role: "Teenager",
    avatar: "A",
    color: "#E91E63", // Pink
    emoji: "🌟"
  },
  {
    id: "onyx" as User,
    name: "Onyx", 
    age: 11,
    role: "Kid",
    avatar: "O",
    color: "#2196F3", // Blue
    emoji: "⭐"
  },
  {
    id: "lauren" as User,
    name: "Lauren",
    age: null,
    role: "Mom",
    avatar: "L",
    color: "#4CAF50", // Green
    emoji: "👩‍👧‍👦"
  },
  {
    id: "brett" as User,
    name: "Brett",
    age: null,
    role: "Dad",
    avatar: "B", 
    color: "#FF9800", // Orange
    emoji: "👨‍👧‍👦"
  }
];

interface UserSelectProps {
  onUserSelected: (user: User) => void;
}

export default function UserSelectScreen({ onUserSelected }: UserSelectProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = (screenWidth - 60) / 2; // 2 columns with padding

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    await AsyncStorage.setItem(USER_KEY, user);
    notifyUserSwitch(user); // Emit event for tab layout to listen
    onUserSelected(user);
  };

  return (
    <PaperProvider>
      <View style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
        {/* Header */}
        <View style={{ 
          paddingTop: 80, 
          paddingBottom: 40,
          paddingHorizontal: 20,
          backgroundColor: "#fff",
          borderBottomLeftRadius: 30,
          borderBottomRightRadius: 30,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4
        }}>
          <Text variant="headlineLarge" style={{ 
            fontWeight: "bold", 
            color: "#333", 
            textAlign: "center",
            marginBottom: 8
          }}>
            Welcome to Merets
          </Text>
          <Text variant="bodyLarge" style={{ 
            color: "#666", 
            textAlign: "center"
          }}>
            Who's here?
          </Text>
        </View>

        {/* User Grid */}
        <View style={{ 
          flex: 1,
          padding: 20,
          paddingTop: 30
        }}>
          <View style={{ 
            flexDirection: "row", 
            flexWrap: "wrap",
            justifyContent: "space-between",
            gap: 16
          }}>
            {users.map((user) => (
              <TouchableOpacity
                key={user.id}
                onPress={() => handleUserSelect(user.id)}
                activeOpacity={0.7}
                style={{ width: cardWidth }}
              >
                <Surface 
                  style={{ 
                    borderRadius: 20,
                    padding: 20,
                    alignItems: "center",
                    backgroundColor: selectedUser === user.id ? `${user.color}15` : "white",
                    borderWidth: selectedUser === user.id ? 3 : 0,
                    borderColor: user.color,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 5,
                    minHeight: 200
                  }}
                >
                  {/* Avatar */}
                  <Avatar.Text 
                    size={80} 
                    label={user.avatar}
                    style={{ 
                      backgroundColor: user.color,
                      marginBottom: 12
                    }}
                    labelStyle={{ fontSize: 36, fontWeight: "bold" }}
                  />
                  
                  {/* Emoji */}
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>
                    {user.emoji}
                  </Text>

                  {/* Name */}
                  <Text variant="titleLarge" style={{ 
                    fontWeight: "bold",
                    color: "#333",
                    marginBottom: 4,
                    textAlign: "center"
                  }}>
                    {user.name}
                  </Text>

                  {/* Role & Age */}
                  <Text variant="bodyMedium" style={{ 
                    color: user.color,
                    fontWeight: "600",
                    textAlign: "center"
                  }}>
                    {user.role}
                    {user.age && ` • ${user.age}`}
                  </Text>
                </Surface>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </PaperProvider>
  );
}
