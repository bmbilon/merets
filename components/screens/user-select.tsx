import React, { useState } from "react";
import { View, ScrollView, Image } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Provider as PaperProvider,
  Button,
  Card,
  Text,
  Avatar,
} from "react-native-paper";

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
    description: "Track your commitments and earn rewards! 🌟"
  },
  {
    id: "onyx" as User,
    name: "Onyx", 
    age: 11,
    role: "Kid",
    avatar: "O",
    color: "#2196F3", // Blue
    description: "Make commitments and collect stickers! ⭐"
  },
  {
    id: "lauren" as User,
    name: "Lauren",
    age: null,
    role: "Mom",
    avatar: "L",
    color: "#4CAF50", // Green
    description: "Manage kids' commitments and rewards 👩‍👧‍👦"
  },
  {
    id: "brett" as User,
    name: "Brett",
    age: null,
    role: "Dad",
    avatar: "B", 
    color: "#FF9800", // Orange
    description: "Parent dashboard and family oversight 👨‍👧‍👦"
  }
];

interface UserSelectProps {
  onUserSelected: (user: User) => void;
}

export default function UserSelectScreen({ onUserSelected }: UserSelectProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleUserSelect = async (user: User) => {
    setSelectedUser(user);
    await AsyncStorage.setItem(USER_KEY, user);
    onUserSelected(user);
  };

  return (
    <PaperProvider>
      <ScrollView style={{ flex: 1, backgroundColor: "#f5f5f5" }}>
        <View style={{ padding: 20, paddingTop: 60 }}>
          {/* Header */}
          <View style={{ alignItems: "center", marginBottom: 40 }}>
            <Text variant="displaySmall" style={{ fontWeight: "bold", color: "#333", textAlign: "center" }}>
              Welcome to
            </Text>
            <Text variant="displayMedium" style={{ fontWeight: "bold", color: "#6200ee", textAlign: "center" }}>
              Merets
            </Text>
            <Text variant="bodyLarge" style={{ color: "#666", textAlign: "center", marginTop: 8 }}>
              Who's using the app today?
            </Text>
          </View>

          {/* User Selection Cards */}
          <View style={{ gap: 16 }}>
            {users.map((user) => (
              <Card 
                key={user.id}
                style={{ 
                  elevation: 4,
                  backgroundColor: selectedUser === user.id ? `${user.color}20` : "white"
                }}
              >
                <Card.Content style={{ padding: 20 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
                    <Avatar.Text 
                      size={60} 
                      label={user.avatar}
                      style={{ backgroundColor: user.color }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="headlineSmall" style={{ fontWeight: "bold", color: "#333" }}>
                        {user.name}
                      </Text>
                      <Text variant="bodyMedium" style={{ color: user.color, fontWeight: "600" }}>
                        {user.role}{user.age ? ` • ${user.age} years old` : ""}
                      </Text>
                      <Text variant="bodySmall" style={{ color: "#666", marginTop: 4 }}>
                        {user.description}
                      </Text>
                    </View>
                  </View>
                  <Button
                    mode="contained"
                    style={{ 
                      marginTop: 16, 
                      backgroundColor: user.color,
                      borderRadius: 25 
                    }}
                    onPress={() => handleUserSelect(user.id)}
                  >
                    Continue as {user.name}
                  </Button>
                </Card.Content>
              </Card>
            ))}
          </View>

          {/* Footer */}
          <View style={{ alignItems: "center", marginTop: 40, marginBottom: 20 }}>
            <Text variant="bodySmall" style={{ color: "#999", textAlign: "center" }}>
              Each family member has their own personalized experience
            </Text>
          </View>
        </View>
      </ScrollView>
    </PaperProvider>
  );
}

// Export the User type and users array for use in other components
export { User, users, USER_KEY };