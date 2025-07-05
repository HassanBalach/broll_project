import { supabase } from './supabase'

export const signUp = async (email: string, password: string) => {
  console.log('Attempting signup with:', { email, password });

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  console.log('SignUp Response:', { data, error });

  if (error) {
    console.error('Signup error details:', error);
    return { data: null, error };
  }

  return { data, error: null };
};





export const signIn = async (email: string, password: string) => {
  console.log('Attempting signin with:', { email , password });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  console.log('SignIn Response:', { data, error });

  if (error) {
    console.error('Signin error details:', error.message, error.status);
    return { data: null, error };
  }

  return { data, error: null };
};


 export const signOut = async () => {
//   const { error } = await supabase.auth.signOut()
//   return { error }
 }
 export const getCurrentUser = async () => {
//   const { data: { user }, error } = await supabase.auth.getUser()
//   return { user, error }
 }