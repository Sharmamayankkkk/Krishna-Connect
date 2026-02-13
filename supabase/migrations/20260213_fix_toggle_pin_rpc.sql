-- Fix toggle_pin_post function to handle text verified column
create or replace function toggle_pin_post(p_post_id bigint)
returns json as $$
declare
  v_user_id uuid := auth.uid();
  v_is_verified boolean;
  v_current_count int;
  v_is_pinned boolean;
  v_post_owner uuid;
begin
  -- Get post owner and current pin status
  select user_id, (pinned_at is not null) 
  into v_post_owner, v_is_pinned 
  from posts where id = p_post_id;
  
  -- Check post exists and belongs to user
  if v_post_owner is null then
    return json_build_object('success', false, 'message', 'Post not found');
  end if;
  
  if v_post_owner != v_user_id then
    return json_build_object('success', false, 'message', 'Can only pin your own posts');
  end if;
  
  -- Get verification status safely handling text or boolean column
  -- We assume if it's text, 'true' means verified.
  select coalesce(verified::text = 'true', false) into v_is_verified from profiles where id = v_user_id;
  
  if v_is_pinned then
    -- Unpin the post
    update posts set pinned_at = null where id = p_post_id;
    return json_build_object('success', true, 'is_pinned', false, 'message', 'Post unpinned');
  else
    -- Check limit for unverified users only
    if not v_is_verified then
      select count(*) into v_current_count 
      from posts where user_id = v_user_id and pinned_at is not null;
      
      if v_current_count >= 3 then
        return json_build_object('success', false, 'message', 'Maximum 3 pinned posts. Get verified for unlimited pins!');
      end if;
    end if;
    
    -- Pin the post
    update posts set pinned_at = now() where id = p_post_id;
    return json_build_object('success', true, 'is_pinned', true, 'message', 'Post pinned to your profile');
  end if;
end;
$$ language plpgsql security definer;
