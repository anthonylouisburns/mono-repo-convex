'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import { getPlayStatus } from '@packages/backend/convex/everwhz';
import { msToTime } from '../../utilities';
import { Howl, Howler } from 'howler';
import { Button } from './common/button';
import { useEffect, useState } from 'react';



export default function Player({ player_episode_id }: { player_episode_id: Id<"episode"> | undefined }) {
    const UPDATE_DELAY_SECONDS = 5
    const [lastUpdatePos, setLastUpdatePos] = useState(0)
    const [sound, setSound] = useState<Howl>()
    const episodeName =  useQuery(api.everwhz.episodeName, { id: player_episode_id });
    const {episode, podcast} = episodeName?episodeName:{ episode: null, podcast: null }
    const getPlayStatus = useQuery(api.everwhz.getPlayStatus, { id: player_episode_id })
    const set_play_status = useMutation(api.everwhz.playStatus);
    const player_podcast_name = podcast?.title
    const { Howl, Howler } = require('howler');

    async function stopSound() {
        // sound.stopAsync();
        // setIsPlaying(false)
        console.log("stop sound")
        sound?.pause()
    }
    
    useEffect(() => {
        if (sound) {
            stopSound()
            sound.unload()
            setSound(undefined)
            console.log("sound deleted", sound)
            setCurrentTime(0)
            setDuration(0)
        }
    }, [player_episode_id])


    const [currentTime, setCurrentTime] = useState<number>(0)
    const [duration, setDuration] = useState<number>(0)
    useEffect(() => {
        let timerInterval: any;
        if (sound && player_episode_id) {
            const updaterTimer = () => {
                const pos = sound.seek()
                setCurrentTime(Math.round(pos))
                setDuration(1000 * sound.duration())
                if(Math.abs(pos-lastUpdatePos) > UPDATE_DELAY_SECONDS){
                    set_play_status({position: pos * 1000, id: player_episode_id})
                    setLastUpdatePos(pos)
                }
            };
            //The return value of setInterval is a unique identifier for the timer, 
            //which is stored in the timerInterval variable in this case.
            // This identifier can be used later with the clearInterval function to stop the recurring timer.
            timerInterval = setInterval(updaterTimer, 1000)
        }
        return () => {
            clearInterval(timerInterval)
        }
    }, [sound,lastUpdatePos, player_episode_id, set_play_status])


    async function playSound() {
        const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
        console.log("play sound")
        // console.log('Loading Sound');
        // setIsPlaying(true)

        const mp3_link = episode?.body.enclosure["@_url"]
        

        if (!sound) {
            const new_sound = new Howl({
                src: [ mp3_link], 
                html5: true
            })
            const new_position = getPlayStatus ? getPlayStatus.position : 0

            setSound(new_sound)
            console.log("new_pos:", new_position)
            new_sound.seek(new_position / 1000)
            new_sound.play()

        } else {
            sound.play()
        }
    }

    return (
        <div className="header-center"  >
            <div>
                {player_podcast_name}
                <div className="heavy" dangerouslySetInnerHTML={{ __html: episode?.body.title }} />
                <button className="navigation-button" onClick={() => playSound()}>play</button>
                <button className="navigation-button" onClick={() => stopSound()}>stop</button>
                {msToTime(currentTime ? currentTime * 1000 : 0)} / {msToTime(duration)}
            </div>
        </div>
    );
}