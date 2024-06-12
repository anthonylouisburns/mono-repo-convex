import { View, Text, TextInput, } from "react-native";
import { styles } from './Styles';
import { useAuth, useUser } from '@clerk/clerk-expo';
// import TrackPlayer from 'react-native-track-player';
// https://rntp.dev/docs/basics/getting-started

//https://docs.expo.dev/versions/latest/sdk/audio/
import { useContext, useEffect, useState } from 'react';
import { AVPlaybackStatus, Audio, InterruptionModeAndroid, InterruptionModeIOS } from 'expo-av';
import { EpisodeView } from "./EpisodeView";
import { useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { AudioContext } from '../../AudiContext'
import { Id } from "@packages/backend/convex/_generated/dataModel";
import HTMLView from 'react-native-htmlview';


const Player = () => {
    const { isLoaded, } = useAuth();

    const {
        sound,
        setSound,
        episode_id,
        podcast_name,
        duration,
        set_duration,
        position,
        set_position,
    } = useContext(AudioContext);


    const [position1, setPosition] = useState("-");

    const episode = useQuery(api.everwzh.episode, { id: episode_id as Id<"episode"> });

    function playStatus(status: AVPlaybackStatus) {
        if (status["isPlaying"]) {
            setPosition(msToTime(status["positionMillis"]))
            set_position(msToTime(status["positionMillis"]))
        }
    }
    function playStatusNoOp(status: AVPlaybackStatus) { }

    function positionFocus() {
        sound.setOnPlaybackStatusUpdate(playStatusNoOp);
    }

    function positionFocusOut() {
        sound.setPositionAsync(timeToMs(position1))
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

        const { sound, status } = (position.length > 1) ?
            await Audio.Sound.createAsync(source, { positionMillis: timeToMs(position) }, playStatus) :
            await Audio.Sound.createAsync(source, {}, playStatus);

        set_duration(msToTime(status["durationMillis"]))
        setSound(sound);

        console.log('Playing Sound');
        await sound.playAsync();
    }




    if (!isLoaded) {
        return <Text>hello</Text>;
    }


    return (
        <View style={styles.player_center}  >
            <View style={styles.player}>
                <Text style={styles.podcast_name}>{podcast_name}:</Text>
            </View>
            <View style={styles.player}>
                <HTMLView value={episode?.body.title} />
            </View>
            <View style={styles.player}>
                <Text style={styles.link} onPress={playSound}>play </Text>
                <TextInput style={styles.white} value={position} onFocus={positionFocus} onBlur={positionFocusOut} onChangeText={text => setPosition(text)} />
                <Text> / {duration}</Text>
                <Text style={styles.link} onPress={stopSound}> stop</Text>
            </View>
        </View>
    );
}

export default Player;

