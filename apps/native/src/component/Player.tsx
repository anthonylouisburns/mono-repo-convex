import { View, Text, TextInput, } from "react-native";
import { styles } from './Styles';
import { useAuth, useUser } from '@clerk/clerk-expo';
// import TrackPlayer from 'react-native-track-player';
// https://rntp.dev/docs/basics/getting-started

//https://docs.expo.dev/versions/latest/sdk/audio/
import { useContext, useEffect, useState } from 'react';
import { AVPlaybackStatus, AVPlaybackStatusError, Audio, } from 'expo-av';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { AudioContext } from '../../AudioContext'
import { Id } from "@packages/backend/convex/_generated/dataModel";
import HTMLView from 'react-native-htmlview';
import { msToTime, timeToMs } from "../utilities";


const Player = () => {
    const UPDATE_DELAY_SECONDS = 20
    const [lastUpdatePos, setLastUpdatePos] = useState(0)
    const { isLoaded, } = useAuth();
    const {
        sound
    }:{sound:Audio.Sound} = useContext(AudioContext);

    const {
        setSound,
        player_podcast_name,
        player_episode_id,
        setIsPlaying,
        isPlaying
    } = useContext(AudioContext);


    const [position, setPosition] = useState("-");
    const [duration, setDuration] = useState("-");

    const episode = useQuery(api.everwzh.episode, { id: player_episode_id as Id<"episode"> });


    const set_play_status = useMutation(api.everwzh.playStatus);

    function playStatus(playbackStatus: AVPlaybackStatus) {
        if (!playbackStatus.isLoaded) {
            // Update your UI for the unloaded state
            if (playbackStatus["error"]) {
                console.log(`Encountered a fatal error during playback: ${playbackStatus["error"]}`);
                // Send Expo team the error on Slack or the forums so we can help you debug!
            }
        } else {
            if (playbackStatus.isPlaying) {
                const pos = playbackStatus.positionMillis
                if(pos - timeToMs(position) > 1000){
                    setPosition(msToTime(pos))
                    // [x] mutation save place
                    if(Math.abs(pos-lastUpdatePos) > UPDATE_DELAY_SECONDS*1000){
                        set_play_status({ id: player_episode_id, position: pos })
                        setLastUpdatePos(pos)
                    }
                }
            }
        }
    }

    function playStatusNoOp(status: AVPlaybackStatus) { }

    function positionFocus() {
        console.log("focus")
        sound.setOnPlaybackStatusUpdate(playStatusNoOp);
    }

    function positionFocusOut() {
        sound.setPositionAsync(timeToMs(position))
        sound.setOnPlaybackStatusUpdate(playStatus)
    }



    async function stopSound() {
        sound.stopAsync();
        setIsPlaying(false)
    }

    const getPlayStatus = useQuery(api.everwzh.getPlayStatus, { id: player_episode_id })

    useEffect(() => {
        if (!sound || !isPlaying) {
            const new_position = getPlayStatus ? getPlayStatus.position : 0
            setPosition(msToTime(new_position))
            console.log("useEffect 2")
        }
        if(sound && !isPlaying){
            const new_position = getPlayStatus ? getPlayStatus.position : 0
            sound.setPositionAsync(new_position)
        }
    }, [getPlayStatus,]);

    async function playSound() {
        console.log('Loading Sound');
        setIsPlaying(true)
        // const mp3_link = "https://500songs.com/podcast-download/2144/song-174b-i-heard-it-through-the-grapevine-part-two-it-takes-two.mp3"

        const mp3_link = episode?.body.enclosure["@_url"]
        const source = { uri: mp3_link };

        const { sound, status } = (position.length > 1) ?
            await Audio.Sound.createAsync(source, { positionMillis: timeToMs(position) }, playStatus) :
            await Audio.Sound.createAsync(source, {}, playStatus);

        setDuration(msToTime(status["durationMillis"]))
        setSound(sound);

        console.log('Playing Sound');
        await sound.playAsync();
    }

    if (!isLoaded || !player_episode_id) {
        return <></>;
    }

    return (
        <View style={styles.player_center}  >
            <View style={styles.player}>
                <Text>{msToTime(getPlayStatus ? getPlayStatus.position : 0)}</Text>
                <Text style={styles.podcast_name}>{player_podcast_name}:</Text>
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

