export async function getNextHand() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 1. Try DB RPC (The ideal path)
  let { data, error } = await supabase.rpc('get_next_hand', { p_user_id: user?.id })

  // 2. THE FIX: If RPC fails, do the randomization in JavaScript
  if (error || !data) {
     console.log("RPC failed, using JS Randomizer");

     // Fetch up to 50 images (instead of limit(1))
     const { data: list } = await supabase.from('images').select('*').limit(50);

     if (list && list.length > 0) {
         // Pick a random index from the list we found
         const randomIndex = Math.floor(Math.random() * list.length);
         data = list[randomIndex];
     }
  }

  // 3. Final Fallback: Use Hardcoded List (If DB is totally dead)
  if (!data) {
     const random = BACKUP_IMAGES[Math.floor(Math.random() * BACKUP_IMAGES.length)];
     return {
       image: {
         url: random.url,
         id: random.id,
         type: random.type,
         source: 'Backup System'
       }
     }
  }

  return { image: data }
}