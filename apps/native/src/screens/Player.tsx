import { View, Text, TextInput, } from "react-native";
import { EverwhzHeader, styles } from "../component/EverwhzHeader";
import { useAuth, useUser } from '@clerk/clerk-expo';
// import TrackPlayer from 'react-native-track-player';
// https://rntp.dev/docs/basics/getting-started

//https://docs.expo.dev/versions/latest/sdk/audio/
import { useEffect, useState } from 'react';
import { StyleSheet, Button } from 'react-native';
import { AVPlaybackStatus, Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { Episode } from "../component/Episode";
import { useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';


const Player = ({ route, navigation }) => {
    const { isLoaded, } = useAuth();
    // TrackPlayer.setupPlayer()
    const { page, episode_id, podcast_name } = route.params;

    const [sound, setSound] = useState<Audio.Sound>();
    const [position, setPosition] = useState("-");
    const [duration, setDuration] = useState("-");

    const episode = useQuery(api.everwzh.episode, { id: episode_id });

    function playStatus(status: AVPlaybackStatus) {
        if (status["isPlaying"]) {
            setPosition(msToTime(status["positionMillis"]))
        }
    }
    function playStatusNoOp(status: AVPlaybackStatus) { }

    function positionFocus() {
        sound.setOnPlaybackStatusUpdate(playStatusNoOp);
    }

    function positionFocusOut() {
        sound.setPositionAsync(timeToMs(position))
        sound.setOnPlaybackStatusUpdate(playStatus);
    }

    function msToTime(duration) {
        const milliseconds = Math.floor((duration % 1000) / 10),
            seconds = Math.floor((duration / 1000) % 60),
            minutes = Math.floor((duration / (1000 * 60)) % 60),
            hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

        // var h = (hours < 10) ? "0" + hours : hours;
        const h = hours;
        const m = (minutes < 10) ? "0" + minutes : minutes;
        const s = (seconds < 10) ? "0" + seconds : seconds;
        // const ms = (milliseconds < 10) ? "0" + milliseconds : milliseconds;

        return h + ":" + m + ":" + s;//+ "." + ms;
    }

    function timeToMs(positionString) {
        const h = Number(positionString.slice(0, -6))
        const m = Number(positionString.slice(-5, -3))
        const s = Number(positionString.slice(-2))

        const newPosition = (h * 1000 * 60 * 60) + (m * 1000 * 60) + (s * 1000);
        return newPosition
    }

    async function stopSound() {
        sound.stopAsync();
    }

    async function playSound() {
        console.log('Loading Sound');
        // const mp3_link = "https://500songs.com/podcast-download/2144/song-174b-i-heard-it-through-the-grapevine-part-two-it-takes-two.mp3"

        const mp3_link = episode?.body.enclosure["@_url"]
        const source = { uri: mp3_link };

        // const { sound } = await Audio.Sound.createAsync(require('./assets/Hello.mp3'));
        // const { sound, status } = await Audio.Sound.createAsync(source, { positionMillis: timeToMs(position) }, playStatus);
        const { sound, status } = (position.length > 1) ?
            await Audio.Sound.createAsync(source, { positionMillis: timeToMs(position) }, playStatus) :
            await Audio.Sound.createAsync(source, {}, playStatus);

        setDuration(msToTime(status["durationMillis"]))
        setSound(sound);

        console.log('Playing Sound');
        await sound.playAsync();
    }

    useEffect(() => {
        Audio.setAudioModeAsync({
            staysActiveInBackground: true,
            playsInSilentModeIOS: true,
            interruptionModeIOS: InterruptionModeIOS.DuckOthers,
            interruptionModeAndroid: InterruptionModeAndroid.DuckOthers,
            shouldDuckAndroid: true,
            playThroughEarpieceAndroid: true,
        });

        return sound
            ? () => {
                console.log('Unloading Sound');
                sound.unloadAsync();
            }
            : undefined;
    }, [sound]);


    if (!isLoaded) {
        return null;
    }

    return (
        <View style={styles.container}>
            <EverwhzHeader navigation={navigation} page="player" />
            <View style={styles.container_center}>
                <Text style={styles.title}>{podcast_name}</Text>
                <Episode episode_id={episode_id} />
            </View>
            <View style={styles.player_center}>
                <Button title="Play" onPress={playSound} />
                <Button title="Stop" onPress={stopSound} />
            </View>
            <View style={styles.player_center}>
                <TextInput value={position} onFocus={positionFocus} onBlur={positionFocusOut} onChangeText={text => setPosition(text)} /><Text> / {duration}</Text>
            </View>
        </View>
    );
}

export default Player;

// TODO
// 1. check everything works
// 2. check everything in
// 3. play audio
// ....
// 4. clean up delete unused code
// 5. release