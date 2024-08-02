'use client';

import { useQuery, } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';
import { Id } from '@packages/backend/convex/_generated/dataModel';
import { useOutletContext, useParams } from 'react-router-dom';
import { PlayerContext } from '../../App';
export default function Episode(): JSX.Element {
  const { episode_id } = useParams()
  const {set_player_episode_id} = useOutletContext<PlayerContext>();

  const episodeName = useQuery(api.everwhz.episodeName, { id: episode_id as Id<"episode"> });
  const { episode, podcast } = episodeName ? episodeName : { episode: null, podcast: null }
  const player_podcast_name = podcast?.title



  async function selectEpisode() {
    set_player_episode_id(episode_id as Id<"episode">)
  }
  if (!episode_id) {
    return <>No such episode</>
  }

  return <div>
    <div className="pagePadding">
      {player_podcast_name}
      <div className="heavy" dangerouslySetInnerHTML={{ __html: episode?.title ? episode.title : "" }} />
      <button className='navigation-button' onClick={() => selectEpisode()}>+</button>
      <div className="dangerous" dangerouslySetInnerHTML={{ __html: episode?.body["content:encoded"] }} />
    </div>
  </div>
}

