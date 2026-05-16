import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { forbiddenResponse, isInternalUser, requireAuth } from '@/app/api/lib/auth';
import { ListRepository } from '@/app/api/repositories/ListRepository';

const listRepository = new ListRepository();

export async function POST(request: NextRequest) {
  try {
    const user = requireAuth(request);
    if (user instanceof NextResponse) return user;
    if (!isInternalUser(user)) return forbiddenResponse();

    const body = await request.json();
    const webhookUrl = process.env.N8N_WEBHOOK_URL;

    if (!webhookUrl) {
      console.error('N8N_WEBHOOK_URL não configurada');
      return NextResponse.json(
        { error: 'Configuração do n8n ausente no servidor' },
        { status: 500 }
      );
    }

    // Forward to n8n
    const response = await axios.post(webhookUrl, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    let notificationMarked = false;
    if (body.quotation_id) {
      try {
        await listRepository.markClientNotification(body.quotation_id, 'sent');
        notificationMarked = true;
      } catch (markError) {
        console.warn('n8n enviado, mas não foi possível marcar notificação:', markError);
      }
    }

    return NextResponse.json({
      success: true,
      notificationMarked,
      data: response.data,
    });

  } catch (error: any) {
    console.error('Erro ao chamar n8n:', error?.response?.data || error.message);
    return NextResponse.json(
      { error: 'Falha ao processar automação no n8n' },
      { status: 500 }
    );
  }
}
