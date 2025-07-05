import { redirect } from 'next/navigation'

import { createClient } from '../utils/supabase/client'

export default async function PrivatePage() {
  const supabase = await createClient()

  console.log({supabase})

  const { data, error } = await supabase.auth.getUser()
  console.log({data, error})
  if (error || !data?.user) {
    redirect('/login')
  }

  return <p>Hello {data.user.email}</p>
}