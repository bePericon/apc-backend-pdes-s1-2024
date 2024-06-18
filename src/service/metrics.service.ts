import promClient from 'prom-client';

class MetricsService {
  protected instance;

  constructor() {
    this.instance = new promClient.Registry();
  }

  public async register() {
    return this.instance;
  }
}

export default new MetricsService();
