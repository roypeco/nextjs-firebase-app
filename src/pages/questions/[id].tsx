import { useEffect, useState, FormEvent } from 'react'
import { useRouter } from 'next/router'
import { Answer } from '../../models/Answer'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore'
import Layout from '../../components/Layout'
import { Question } from '../../models/Question'
import { useAuthentication } from '../../hooks/authentication'

type Query = {
  id: string
}

export default function QuestionsShow() {
  const router = useRouter()
  const routerQuery = router.query as Query
  const { user } = useAuthentication()
  const [question, setQuestion] = useState<Question | null>(null)
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [isSending, setIsSending] = useState<boolean>(false)
  const [body, setBody] = useState<string>("")
  

  function getCollections() {
    const db = getFirestore()
    return {
      db,
      questionsCollection: collection(db, 'questions'),
      answersCollection: collection(db, 'answers'),
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsSending(true)
  
    const { db, questionsCollection, answersCollection } = getCollections()
    const answerRef = doc(answersCollection)
  
    if (user && question) {
        await runTransaction(db, async (t) => {
        t.set(answerRef, {
            uid: user.uid,
            questionId: question.id,
            body,
            createdAt: serverTimestamp(),
        })
        t.update(doc(questionsCollection, question.id), {
            isReplied: true,
        })
    })}

    const now = new Date().getTime()
    if (user && question) {
        setAnswer({
        id: '',
        uid: user.uid,
        questionId: question.id,
        body,
        createdAt: new Timestamp(now / 1000, now % 1000),
    })}
  }

  async function loadData() {
    if (routerQuery.id === undefined) {
      return
    }

    const { questionsCollection, answersCollection } = getCollections()
    const questionDoc = await getDoc(doc(questionsCollection, routerQuery.id))
    if (!questionDoc.exists()) {
      return
    }

    const gotQuestion = questionDoc.data() as Question
    gotQuestion.id = questionDoc.id
    setQuestion(gotQuestion)

    if (!gotQuestion.isReplied) {
        return
      }
      
      const answerSnapshot = await getDocs(
        query(
          answersCollection,
          where('questionId', '==', gotQuestion.id),
          limit(1)
        )
      )
      if (answerSnapshot.empty) {
        return
      }
      
      const gotAnswer = answerSnapshot.docs[0].data() as Answer
      gotAnswer.id = answerSnapshot.docs[0].id
      setAnswer(gotAnswer)
  }

  useEffect(() => {
    if (user === null) {
        return
    }
    loadData()
  }, [routerQuery.id, user])

  return (
    <Layout>
        <div className="row justify-content-center">
            <section className="text-center mt-4">
                <h2 className="h4">回答する</h2>
                <div className="col-12 col-md-6">
                    {question && (
                        <>
                        <div className="card">
                            <div className="card-body">{question.body}</div>
                        </div>
                            <section className="text-center mt-4">
                                <h2 className="h4">回答</h2>
                                {answer === null ? (
                                <form onSubmit={onSubmit}>
                                    <textarea
                                    className="form-control"
                                    placeholder="おげんきですか？"
                                    rows={6}
                                    value={body}
                                    onChange={(e) => setBody(e.target.value)}
                                    required
                                    ></textarea>
                                    <div className="m-3">
                                    {isSending ? (
                                        <div
                                        className="spinner-border text-secondary"
                                        role="status"
                                        ></div>
                                    ) : (
                                        <button type="submit" className="btn btn-primary">
                                        回答する
                                        </button>
                                    )}
                                    </div>
                                </form>
                                ) : (
                                <div className="card">
                                    <div className="card-body text-left">{answer.body}</div>
                                </div>
                                )}
                            </section>
                        </>
                    )}
                </div>
            </section>
        </div>
    </Layout>
  )
}