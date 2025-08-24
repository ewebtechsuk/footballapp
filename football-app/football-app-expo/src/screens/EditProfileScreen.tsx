import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Platform,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useSelector, useDispatch } from "react-redux";
import { updateProfile } from "../store/slices/userSlice";
import { updateUserProfile } from "../services/firestore";
import { uploadAvatar } from "../services/storage";
import { uploadUserAvatar } from "../services/avatarFlow";

// Minimal edit profile screen: updates local redux user.name if a user slice exists.
const EditProfileScreen = ({ navigation }: { navigation: any }) => {
  const user = useSelector((s: any) => s.user ?? null);
  const dispatch = useDispatch();
  const [name, setName] = useState(user?.name ?? "");
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [position, setPosition] = useState(user?.position ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? "");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const bioMax = 300;

  const handleSave = () => {
    // Optimistically update the UI
    const prev = {
      name: user?.name ?? "",
      displayName: user?.displayName ?? "",
      bio: user?.bio ?? "",
      position: user?.position ?? "",
    };
    dispatch(updateProfile({ name, displayName, bio, position } as any));

    // Try to persist to Firestore; if it fails, revert and show an error.
    (async () => {
      try {
        const userId = user?.id ?? (user as any)?.uid ?? null;
        if (!userId) throw new Error("No user ID available");
        await updateUserProfile(userId, {
          name,
          displayName,
          bio,
          position,
          avatarUrl,
        });
        Alert.alert("Saved", "Profile updated");
        navigation.goBack();
      } catch (err) {
        // revert optimistic update
        dispatch(updateProfile(prev as any));
        console.error("Failed to persist profile", err);
        Alert.alert(
          "Error",
          "Failed to save profile to server. Changes reverted.",
        );
      }
    })();
  };

  const handleFilePick = async (file: any) => {
    if (!file) return;
    try {
      const userId = user?.id ?? (user as any)?.uid ?? null;
      if (!userId) throw new Error("No user ID available");
      // optimistic UI
      const prev = avatarUrl;
      // Validate file size/type and upload with progress
      let blob: Blob | File | null = null;
      let mime: string | undefined;
      let size = 0;

      if (Platform.OS === "web") {
        // file is a File
        blob = file as File;
        mime = blob.type;
        size = (blob as File).size || 0;
        // show a local preview quickly
        try {
          setAvatarUrl(URL.createObjectURL(blob));
        } catch (e) {
          // ignore preview errors
        }
      } else {
        // native: file is a local uri string
        setAvatarUrl(file);
        const resp = await fetch(file);
        blob = await resp.blob();
        mime = blob.type;
        size = (blob as any).size || 0;
      }

      // validation: allow images only, and limit to 5MB
      const maxBytes = 5 * 1024 * 1024;
      if (mime && !mime.startsWith("image/")) {
        Alert.alert("Invalid file", "Please choose an image file");
        setAvatarUrl(prev);
        return;
      }
      if (size && size > maxBytes) {
        Alert.alert(
          "File too large",
          "Please choose an image smaller than 5 MB",
        );
        setAvatarUrl(prev);
        return;
      }

      setUploading(true);
      setUploadProgress(0);
      try {
        // we already converted to a Blob above, so tell the helper it's not a uri
        const isUri = false;
        await uploadUserAvatar(userId, blob, isUri, {
          onStart: () => {},
          onProgress: (pct) => setUploadProgress(pct),
          onFinish: (url) => {
            setAvatarUrl(url);
            dispatch(updateProfile({ avatarUrl: url } as any));
          },
          onError: () => {},
        });
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    } catch (err) {
      console.error("avatar upload failed", err);
      Alert.alert("Upload failed", "Could not upload avatar");
    }
  };

  const handleChooseAvatarNative = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Permission to access photos is required",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      if (result.canceled) return;
      // result.assets[0].uri is the selected image local uri
      const uri = result.assets && result.assets[0] && result.assets[0].uri;
      if (uri) await handleFilePick(uri);
    } catch (err) {
      console.error("choose avatar failed", err);
      Alert.alert("Error", "Could not select avatar");
    }
  };

  const handleChooseAvatarWeb = () => {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = (e: Event) => {
        const target = e.target as HTMLInputElement;
        const files = target.files;
        if (files && files[0]) {
          handleFilePick(files[0]);
        }
      };
      input.click();
    } catch (err) {
      console.error("choose avatar (web) failed", err);
      Alert.alert("Error", "Could not select avatar");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Edit Profile</Text>

      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: 96, height: 96, borderRadius: 48, marginBottom: 12 }}
        />
      ) : (
        <View
          style={{
            width: 96,
            height: 96,
            backgroundColor: "#eee",
            borderRadius: 48,
            marginBottom: 12,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text>Avatar</Text>
        </View>
      )}

      <Button
        title="Choose Avatar"
        onPress={
          Platform.OS === "web"
            ? handleChooseAvatarWeb
            : handleChooseAvatarNative
        }
        testID="choose-avatar"
      />

      {uploading && (
        <View style={{ marginTop: 8, alignItems: "center" }}>
          <Text>
            Uploading avatar
            {uploadProgress != null ? `: ${uploadProgress}%` : "..."}
          </Text>
          <View
            style={{
              width: "80%",
              height: 8,
              backgroundColor: "#eee",
              borderRadius: 4,
              marginTop: 6,
            }}
          >
            <View
              style={{
                width: `${uploadProgress ?? 0}%`,
                height: 8,
                backgroundColor: "#4caf50",
                borderRadius: 4,
              }}
            />
          </View>
        </View>
      )}

      <TextInput
        value={displayName}
        onChangeText={setDisplayName}
        style={styles.input}
        placeholder="Display name"
      />
      <TextInput
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholder="Full name"
      />

      <View style={{ flexDirection: "row", marginBottom: 8 }}>
        {["Forward", "Midfielder", "Defender", "Goalkeeper"].map((p) => (
          <Button key={p} title={p} onPress={() => setPosition(p)} />
        ))}
      </View>

      <TextInput
        value={position}
        onChangeText={setPosition}
        style={styles.input}
        placeholder="Position (e.g. Forward)"
      />
      <TextInput
        value={bio}
        onChangeText={(t) => setBio(t.slice(0, bioMax))}
        style={[styles.input, styles.textarea]}
        placeholder="Short bio"
        multiline
        numberOfLines={4}
      />
      <Text style={{ alignSelf: "flex-end", marginBottom: 8 }}>
        {bio.length}/{bioMax}
      </Text>

      <Button
        title={uploading ? "Saving..." : "Save"}
        onPress={handleSave}
        disabled={uploading}
        testID="save-button"
      />
      <Button title="Cancel" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, justifyContent: "center" },
  title: { fontSize: 20, marginBottom: 12, textAlign: "center" },
  input: {
    height: 44,
    borderColor: "#ccc",
    borderWidth: 1,
    marginBottom: 12,
    padding: 8,
  },
  textarea: { height: 110, textAlignVertical: "top" as const },
});

export default EditProfileScreen;
