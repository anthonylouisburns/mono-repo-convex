'use client';

import { useContext } from 'react';
import { AudioContext } from '@/components/AudioContext'
import Player from './Player';
import { Id } from '@packages/backend/convex/_generated/dataModel';



export default function PlayerHolder() {
    const {
        playerEpisodeId
    } = useContext(AudioContext);
    if (!playerEpisodeId) {
        return (
            <></>
        );
    }

    return (
        <Player player_episode_id={playerEpisodeId as Id<"episode">} />
    )
}
