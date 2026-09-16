'use client';

import { useParams } from 'next/navigation';

export default function Valid() {
  const params = useParams();
  return <h1>Token: {params.accessToken}</h1>;
}