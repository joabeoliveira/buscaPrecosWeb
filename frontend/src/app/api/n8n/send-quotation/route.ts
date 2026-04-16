import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
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

    return NextResponse.json({
      success: true,
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
