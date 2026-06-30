import os
from supabase import create_client

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

try:
    res = supabase.table("non_existent_table").insert([{"foo": "bar"}]).execute()
    print("Success:", res)
except Exception as e:
    print("Exception:", e)
