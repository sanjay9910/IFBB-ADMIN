'use client';

import React, { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AlertCircle, CheckCircle, Loader2, Plus, Trash2, ChevronDown } from 'lucide-react';

// ← Yeh base URL change kar diya hai (jo pehle kaam kar raha tha)
const BASE_URL = 'https://ifbb-master.onrender.com';

interface Question {
  question: string;
  options: string[];
  correctOptionIndex: number;
}

interface Module {
  _id: string;
  title: string;
  description: string;
  type: string;
  assetLink: string;
  test?: {
    questions: Question[];
    passPercentage?: number;
  };
}

interface Course {
  _id: string;
  title: string;
  modules: Module[];
}

export default function ExamManagerPage() {
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');

  const [questions, setQuestions] = useState<Question[]>([
    { question: '', options: ['', '', '', ''], correctOptionIndex: 0 },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !token) {
      router.replace('/auth/login');
    }
  }, [isAuthenticated, token, router]);

  // Fetch courses
  useEffect(() => {
    if (!token || !isAuthenticated) return;

    const fetchCourses = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`${BASE_URL}/api/admin/get-all-courses`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          credentials: 'include',
        });

        if (res.status === 401) {
          setError('Session expired. Redirecting...');
          setTimeout(() => router.replace('/auth/login'), 2000);
          return;
        }

        if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);

        const data = await res.json();
        setCourses(data.allCourses || []);
      } catch (err: any) {
        setError(err.message || 'Failed to load courses');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [token, isAuthenticated, router]);

  const selectedCourse = courses.find(c => c._id === selectedCourseId);
  const selectedModule = selectedCourse?.modules.find(m => m._id === selectedModuleId);

  useEffect(() => {
    if (selectedModule?.test?.questions?.length) {
      setQuestions(selectedModule.test.questions);
    } else {
      setQuestions([{ question: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
    }
  }, [selectedModule]);

  const addQuestion = () => {
    setQuestions(prev => [...prev, { question: '', options: ['', '', '', ''], correctOptionIndex: 0 }]);
  };

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) return;
    setQuestions(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuestionText = (qIndex: number, value: string) => {
    setQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, question: value } : q));
  };

  const updateOption = (qIndex: number, optIndex: number, value: string) => {
    setQuestions(prev =>
      prev.map((q, i) =>
        i === qIndex
          ? { ...q, options: q.options.map((o, j) => j === optIndex ? value : o) }
          : q
      )
    );
  };

  const setCorrectOption = (qIndex: number, optIndex: number) => {
    setQuestions(prev => prev.map((q, i) => i === qIndex ? { ...q, correctOptionIndex: optIndex } : q));
  };

  // ────────────────────────────────────────────────────────────────
  // Yeh hai pura handleSubmit function jo tumne maanga tha
  // ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedCourseId || !selectedModuleId) {
      setSubmitStatus({ type: 'error', message: 'Course aur module select karo pehle' });
      return;
    }

    const invalid = questions.some(q => !q.question.trim() || q.options.some(o => !o.trim()));
    if (invalid) {
      setSubmitStatus({ type: 'error', message: 'Sab questions aur options bhare hue hone chahiye' });
      return;
    }

    setSubmitting(true);
    setSubmitStatus(null);

    const endpoint = `/api/admin/course/${selectedCourseId}/module/${selectedModuleId}/test`;
    const fullUrl = `${BASE_URL}${endpoint}`;

    console.log('[API → POST]', {
      url: fullUrl,
      tokenStart: token?.substring(0, 10) + '...',
      payload: { questions }
    });

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ questions }),
      });

      console.log('[API ← RESPONSE]', {
        status: response.status,
        url: response.url,
      });

      if (response.status === 401) {
        setSubmitStatus({ type: 'error', message: 'Session khatam ho gaya. Login page pe ja rahe hain...' });
        setTimeout(() => router.replace('/auth/login'), 2000);
        return;
      }

      if (response.status === 404) {
        setSubmitStatus({
          type: 'error',
          message: `404 Not Found\n\nURL: ${fullUrl}\n\nYeh endpoint server pe nahi mila.\nPossible reasons:\n• Base URL galat hai\n• Course ya module ID galat hai\n• Backend mein yeh route bana hi nahi hai`
        });
        return;
      }

      if (!response.ok) {
        let msg = `Error ${response.status}`;
        try {
          const errData = await response.json();
          msg += errData.message ? ` - ${errData.message}` : '';
        } catch {}
        throw new Error(msg);
      }

      const data = await response.json();
      setSubmitStatus({ type: 'success', message: data.message || 'Test successfully save ho gaya!' });

      // Refresh course list
      const refresh = await fetch(`${BASE_URL}/api/admin/get-all-courses`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });

      if (refresh.ok) {
        const fresh = await refresh.json();
        setCourses(fresh.allCourses || []);
      }
    } catch (err: any) {
      console.error('[SAVE ERROR]', err);
      setSubmitStatus({ type: 'error', message: err.message || 'Test save nahi ho paya' });
    } finally {
      setSubmitting(false);
    }
  };

  // ────────────────────────────────────────────────────────────────
  // Render part (same as before, sirf chhoti si improvement)
  // ────────────────────────────────────────────────────────────────
  if (!isAuthenticated || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-blue-600 mb-4" />
          <p className="text-gray-700">Login page...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6 text-black">
          <h1 className="text-3xl text-white font-bold">Add Modules Test</h1>
          <p className="mt-2 text-white opacity-90">For Any Modules, Add Test Here.</p>
        </div>

        <div className="p-6 lg:p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          )}

          {submitStatus && (
            <div
              className={`mb-6 p-4 rounded-lg flex items-center gap-3 whitespace-pre-wrap ${
                submitStatus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
              }`}
            >
              {submitStatus.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span>{submitStatus.message}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Courses load...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Course Select</label>
                  <div className="relative">
                    <select
                      value={selectedCourseId}
                      onChange={e => {
                        setSelectedCourseId(e.target.value);
                        setSelectedModuleId('');
                      }}
                      className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                    >
                      <option value="">Course select</option>
                      {courses.map(c => (
                        <option key={c._id} value={c._id}>{c.title}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Module Select</label>
                  <div className="relative">
                    <select
                      value={selectedModuleId}
                      onChange={e => setSelectedModuleId(e.target.value)}
                      disabled={!selectedCourseId}
                      className="w-full px-4 py-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-blue-500 appearance-none disabled:bg-gray-100 bg-white"
                    >
                      <option value="">Module select</option>
                      {selectedCourse?.modules.map(m => (
                        <option key={m._id} value={m._id}>
                          {m.title} {m.test ? `(${m.test.questions.length} questions)` : '(No test)'}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500 pointer-events-none" />
                  </div>
                </div>
              </div>

              {selectedModuleId && (
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-2xl font-bold text-gray-800">Questions</h2>
                      {/* <button
                        type="button"
                        onClick={addQuestion}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm"
                      >
                        <Plus className="h-5 w-5" /> Add Question
                      </button> */}
                    </div>

                    {questions.map((q, idx) => (
                      <div key={idx} className="bg-white text-black border rounded-xl p-6 relative shadow-sm">
                        {questions.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeQuestion(idx)}
                            className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}

                        <div className="mb-6">
                          <label className="block text-sm font-medium mb-2">Question {idx + 1}</label>
                          <input
                            type="text"
                            value={q.question}
                            onChange={e => updateQuestionText(idx, e.target.value)}
                            placeholder="Write Question here..."
                            className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            required
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {q.options.map((opt, oIdx) => (
                            <div key={oIdx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                              <input
                                type="radio"
                                name={`correct-${idx}`}
                                checked={q.correctOptionIndex === oIdx}
                                onChange={() => setCorrectOption(idx, oIdx)}
                                className="h-5 w-5 text-white text-blue-600"
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={e => updateOption(idx, oIdx, e.target.value)}
                                placeholder={`Option ${oIdx + 1}`}
                                className="flex-1 bg-transparent outline-none"
                                required
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                   <button
                        type="button"
                        onClick={addQuestion}
                        className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-sm"
                      >
                        <Plus className="h-5 w-5" /> Add Question
                      </button>

                  <div className="pt-6 border-t">
                    <button
                      type="submit"
                      disabled={submitting}
                      className={`w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg flex items-center justify-center gap-3 disabled:opacity-60`}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-6 w-6 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        'Save Question'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}