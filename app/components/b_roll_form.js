'use client'

import { useState } from 'react'
import { createClient } from '@/app/utils/supabase/client'

const supabase = createClient()

// Helper function to extract text from PDF
const extractTextFromPDF = async (file) => {
  try {
    console.log('PDF file:', file.name)
    return `PDF content extracted from ${file.name}`
  } catch (error) {
    console.error('Error extracting PDF text:', error)
    return null
  }
}

export default function BRollForm() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState(null)
  const [message, setMessage] = useState(null)
  const [loading, setLoading] = useState(false)
  const [projectId, setProjectId] = useState(null)
  const [brollPrompts, setBrollPrompts] = useState([])
  const [generatingBroll, setGeneratingBroll] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage(null)
    setLoading(true)

    try {
      // Validate title
      if (!title.trim()) {
        setMessage('❌ Title is required.')
        setLoading(false)
        return
      }

      // Check if user is authenticated
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setMessage('❌ You must be logged in to submit a post.')
        setLoading(false)
        return
      }

      // Ensure profile exists (create if it doesn't)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profileData && profileError?.code === 'PGRST116') {
        // Profile doesn't exist, create it
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user.id,
              email: user.email,
              created_at: new Date().toISOString()
            }
          ])

        if (createProfileError) {
          setMessage(`❌ Error creating profile: ${createProfileError.message}`)
          setLoading(false)
          return
        }
      } else if (profileError && profileError.code !== 'PGRST116') {
        setMessage(`❌ Error checking profile: ${profileError.message}`)
        setLoading(false)
        return
      }

      let finalDescription = description

      // If no description but file is provided, extract text from PDF
      if (!description.trim() && file) {
        finalDescription = await extractTextFromPDF(file)
        if (!finalDescription) {
          setMessage('❌ Failed to extract text from PDF.')
          setLoading(false)
          return
        }
      }

      // Validate that we have either description or PDF content
      if (!finalDescription.trim()) {
        setMessage('❌ Description or valid PDF is required.')
        setLoading(false)
        return
      }

      // Insert data into projects table
      const { data, error } = await supabase
        .from('projects')
        .insert([
          {
            user_id: user.id,
            title: title.trim(),
            vsl_content: finalDescription.trim(),
          },
        ])
        .select()

      if (error) {
        console.error('Supabase error:', error)
        setMessage(`❌ Error: ${error.message}`)
      } else {
        // Store the project ID
        const insertedProjectId = data[0]?.id
        setProjectId(insertedProjectId)
        console.log('Project created with ID:', insertedProjectId)
        
        setMessage(`✅ Post submitted successfully! Project ID: ${insertedProjectId}`)
        
        // Generate B-roll prompts
        await generateBrollPrompts(finalDescription)
        
        // Reset form
        setTitle('')
        setDescription('')
        setFile(null)
        const fileInput = document.querySelector('input[type="file"]')
        if (fileInput) fileInput.value = ''
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      setMessage('❌ An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    setFile(selectedFile)
    
    if (message) {
      setMessage(null)
    }
  }

  const generateBrollPrompts = async (scriptContent) => {
    setGeneratingBroll(true)
    try {
      const response = await fetch('/api/generate-broll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: scriptContent
        })
      })

      console.log({response})

      const result = await response.json()

      if (result.success) {
        setBrollPrompts(result.brollPrompts)
        setMessage(prev => prev + ` 🎬 Generated ${result.promptCount} B-roll prompts!`)
      } else {
        console.error('B-roll generation error:', result.error)
        setMessage(prev => prev + ` ⚠️ B-roll generation failed: ${result.error}`)
      }
    } catch (error) {
      console.error('Error calling B-roll API:', error)
      setMessage(prev => prev + ` ⚠️ B-roll generation failed: ${error.message}`)
    } finally {
      setGeneratingBroll(false)
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-xl font-semibold mb-4">Create a New B-Roll Post</h1>
      
      <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
        {projectId && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Current Project ID:</strong> {projectId}
            </p>
          </div>
        )}
        
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          required
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (or upload PDF)"
          rows={5}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="border p-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {file && (
          <p className="text-sm text-gray-600">
            Selected file: {file.name}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors ${
            loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
        
        {generatingBroll && (
          <div className="flex items-center justify-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
            <span className="text-sm text-yellow-700">Generating B-roll prompts...</span>
          </div>
        )}
        
        {message && (
          <p className={`text-sm p-2 rounded ${
            message.includes('✅') 
              ? 'text-green-700 bg-green-50 border border-green-200' 
              : 'text-red-700 bg-red-50 border border-red-200'
          }`}>
            {message}
          </p>
        )}
      </form>

      {/* B-roll Prompts Display */}
      {brollPrompts.length > 0 && (
        <div className="mt-8 p-4 border rounded shadow-sm bg-gray-50">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">Generated B-Roll Prompts</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {brollPrompts.map((prompt, index) => (
              <div key={index} className="bg-white p-3 rounded border border-gray-200">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                    #{index + 1}
                  </span>
                </div>
                <p className="text-sm font-medium text-gray-900 mt-2">
                  {prompt.prompt}
                </p>
                <p className="text-xs text-gray-600 mt-1 italic">
                  "{prompt.scriptReference}"
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}