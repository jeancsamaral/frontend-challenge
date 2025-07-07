import { NextRequest, NextResponse } from 'next/server';
import { Response, StudentSession } from '../../shared/types';
import { ensureOptionsArray } from '../../shared/utils';

// In a real app, you would use a database and WebSocket/Server-Sent Events
// For this demo, we'll use in-memory storage
const sessions: Map<string, StudentSession> = new Map();
const responses: Map<string, Response[]> = new Map();
const activeSessions: Map<string, any> = new Map(); // joinCode -> interactive element

// Enhanced mock questions that can be dynamically created
const mockQuestions = new Map([
  ['ABC123', {
    id: 'q1',
    type: 'interactive',
    interactionType: 'multiple-choice',
    question: 'What is the most important skill for a developer?',
    options: ['Problem Solving', 'Communication', 'Technical Skills', 'Creativity'],
    responses: [],
    position: { x: 100, y: 100 },
    size: { width: 400, height: 300 },
    zIndex: 1,
  }],
  ['DEF456', {
    id: 'q2',
    type: 'interactive',
    interactionType: 'word-cloud',
    question: 'What words describe your ideal work environment?',
    responses: [],
    position: { x: 100, y: 100 },
    size: { width: 400, height: 300 },
    zIndex: 1,
  }],
  ['GHI789', {
    id: 'q3',
    type: 'interactive',
    interactionType: 'live-poll',
    question: 'How do you prefer to learn new technologies?',
    responses: [],
    position: { x: 100, y: 100 },
    size: { width: 400, height: 300 },
    zIndex: 1,
  }],
]);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slideId = searchParams.get('slideId');
  const elementId = searchParams.get('elementId');
  const sessionId = searchParams.get('sessionId');

  if (slideId && elementId) {
    // Get responses for a specific slide element
    const responseKey = `${slideId}-${elementId}`;
    const elementResponses = responses.get(responseKey) || [];
    
    return NextResponse.json({
      success: true,
      data: elementResponses,
    });
  }

  if (sessionId) {
    // Get session info
    const session = sessions.get(sessionId);
    if (session) {
      return NextResponse.json({
        success: true,
        data: session,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
      }, { status: 404 });
    }
  }

  // Return all sessions
  return NextResponse.json({
    success: true,
    data: Array.from(sessions.values()),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create-session') {
      // Handle creating a new session from an interactive element
      const { interactiveElement, joinCode, elementId, presentationId, question, options, interactionType } = body;
      
      if (!joinCode) {
        return NextResponse.json({
          success: false,
          error: 'Join code is required',
        }, { status: 400 });
      }

      // Support both formats: with interactiveElement object or with separate fields
      let element;
      if (interactiveElement) {
        // Format with interactiveElement object
        element = {
          ...interactiveElement,
          id: interactiveElement.id || `element-${Date.now()}`,
          createdAt: new Date(),
          active: true,
        };
      } else {
        // Format with separate fields
        element = {
          id: elementId || `element-${Date.now()}`,
          type: 'interactive',
          question: question || 'Interactive Question',
          options: ensureOptionsArray(options),
          interactionType: interactionType || 'multiple-choice',
          presentationId: presentationId,
          position: { x: 100, y: 100 },
          size: { width: 400, height: 300 },
          zIndex: 1,
          responses: [],
          createdAt: new Date(),
          active: true,
        };
      }

      // Store the active session
      activeSessions.set(joinCode, element);

      return NextResponse.json({
        success: true,
        message: 'Session created successfully',
        joinCode,
        element: element,
      });
    }

    if (action === 'join') {
      // Handle student joining a session
      const { joinCode } = body;
      
      if (!joinCode) {
        return NextResponse.json({
          success: false,
          error: 'Join code is required',
        }, { status: 400 });
      }

      // Check if join code exists in active sessions or mock questions
      let question = activeSessions.get(joinCode) || mockQuestions.get(joinCode);
      
      if (!question) {
        return NextResponse.json({
          success: false,
          error: 'Invalid join code or session has ended',
        }, { status: 400 });
      }

      // Create session
      const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const session: StudentSession = {
        id: sessionId,
        presentationId: question.id || 'unknown',
        joinCode,
        isActive: true,
      };

      sessions.set(sessionId, session);

      return NextResponse.json({
        success: true,
        sessionId,
        question,
        message: 'Successfully joined the session!',
      });
    }

    if (action === 'submit') {
      // Handle student submitting a response
      const { sessionId, questionId, response } = body;
      
      if (!sessionId || !questionId || response === undefined) {
        return NextResponse.json({
          success: false,
          error: 'Session ID, question ID, and response are required',
        }, { status: 400 });
      }

      // Validate session
      const session = sessions.get(sessionId);
      if (!session || !session.isActive) {
        return NextResponse.json({
          success: false,
          error: 'Invalid or inactive session',
        }, { status: 400 });
      }

      // Create response
      const newResponse: Response = {
        id: `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        slideId: 'editor-slide', // Since this comes from editor
        elementId: questionId,
        studentId: sessionId, // Using session ID as student ID for demo
        content: JSON.stringify(response),
        timestamp: new Date(),
      };

      // Store response
      const responseKey = `editor-slide-${questionId}`;
      const existingResponses = responses.get(responseKey) || [];
      existingResponses.push(newResponse);
      responses.set(responseKey, existingResponses);

      return NextResponse.json({
        success: true,
        data: newResponse,
        message: 'Response submitted successfully!',
      });
    }

    if (action === 'get-responses') {
      // Get responses for a specific element
      const { elementId } = body;
      
      if (!elementId) {
        return NextResponse.json({
          success: false,
          error: 'Element ID is required',
        }, { status: 400 });
      }

      const responseKey = `editor-slide-${elementId}`;
      const elementResponses = responses.get(responseKey) || [];
      
      // Process responses for display
      const processedResponses = elementResponses.map(r => ({
        id: r.id,
        content: JSON.parse(r.content),
        timestamp: r.timestamp,
        studentId: r.studentId,
      }));

      return NextResponse.json({
        success: true,
        data: processedResponses,
        count: processedResponses.length,
      });
    }

    if (action === 'end-session') {
      // End an active session
      const { joinCode } = body;
      
      if (!joinCode) {
        return NextResponse.json({
          success: false,
          error: 'Join code is required',
        }, { status: 400 });
      }

      if (activeSessions.has(joinCode)) {
        activeSessions.delete(joinCode);
        // Also deactivate related sessions
        for (const [sessionId, session] of sessions.entries()) {
          if (session.joinCode === joinCode) {
            session.isActive = false;
          }
        }
        
        return NextResponse.json({
          success: true,
          message: 'Session ended successfully',
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Session not found',
        }, { status: 404 });
      }
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action',
    }, { status: 400 });

  } catch (error) {
    console.error('Error handling response:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const joinCode = searchParams.get('joinCode');

  if (sessionId) {
    if (sessions.has(sessionId)) {
      sessions.delete(sessionId);
      return NextResponse.json({
        success: true,
        message: 'Session ended successfully',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Session not found',
      }, { status: 404 });
    }
  }

  if (joinCode) {
    if (activeSessions.has(joinCode)) {
      activeSessions.delete(joinCode);
      return NextResponse.json({
        success: true,
        message: 'Active session removed successfully',
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Active session not found',
      }, { status: 404 });
    }
  }

  return NextResponse.json({
    success: false,
    error: 'Session ID or join code is required',
  }, { status: 400 });
} 