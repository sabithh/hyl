export type BackendHealth = {
  online: boolean;
  message: string;
  url: string;
};

const defaultApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export async function getBackendHealth(): Promise<BackendHealth> {
  try {
    const response = await fetch(`${defaultApiBaseUrl}/api/health`, {
      cache: "no-store",
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return {
        online: false,
        message: `Backend responded ${response.status}`,
        url: defaultApiBaseUrl,
      };
    }

    return {
      online: true,
      message: "Backend connected",
      url: defaultApiBaseUrl,
    };
  } catch {
    return {
      online: false,
      message: "Backend unreachable",
      url: defaultApiBaseUrl,
    };
  }
}
